"""6-stage RAG pipeline: query rewrite -> retrieve -> BM25 rerank -> assemble -> LLM -> citations."""
import asyncio
import os

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from rank_bm25 import BM25Okapi

from rag.vectorstore import create_or_load_vectorstore

load_dotenv()

_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
_RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "15"))
_RERANK_TOP_N = int(os.getenv("RERANK_TOP_N", "5"))

_SYSTEM_PROMPT = (
    "You are an enterprise knowledge assistant. "
    "Answer ONLY using the provided context. "
    "Do not hallucinate or add information not present in the context."
)

_RAG_TEMPLATE = """\
Context:
{context}

Question:
{question}

Instructions:
- Answer based solely on the context above.
- Do NOT embed inline citations or brackets in the answer text.
- If the context does not contain enough information, say so clearly.
"""


# ── Stage 1: Query Processing ─────────────────────────────────────────────────

def _stage1_process_query(query: str, llm: ChatOpenAI, metadata: dict | None = None) -> str:
    """Clean, rewrite, and disambiguate the user query for semantic search."""
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a query optimizer for a knowledge base. "
                "Rewrite the user query to be clear, specific, and optimised for semantic search. "
                "Remove filler words, fix typos, and make implicit intent explicit. "
                "Return ONLY the rewritten query — no explanation.",
            ),
            ("human", "{query}"),
        ]
    )
    chain = prompt | llm | StrOutputParser()
    return chain.invoke(
        {"query": query},
        config={"run_name": "query_rewrite", "tags": ["rag", "stage1"], "metadata": metadata or {}},
    ).strip()


# ── Stage 2: Retrieval ────────────────────────────────────────────────────────

def _stage2_retrieve(query: str) -> list[Document]:
    """Semantic search against Qdrant — fetches a larger candidate pool for BM25 reranking."""
    vectorstore = create_or_load_vectorstore()
    return vectorstore.similarity_search(query, k=_RETRIEVAL_TOP_K)


# ── Stage 3: BM25 Reranking ───────────────────────────────────────────────────

def _stage3_rerank(query: str, chunks: list[Document]) -> list[Document]:
    """Rerank the semantic-search candidates with BM25 (Okapi BM25).

    BM25 scores each chunk by exact keyword overlap with the query using
    term frequency and inverse document frequency, which complements the
    semantic similarity used in retrieval — especially useful for queries
    containing specific codes, names, or technical terms.
    """
    if not chunks:
        return []

    seen: set[str] = set()
    unique: list[Document] = []
    for doc in chunks:
        fingerprint = doc.page_content[:200]
        if fingerprint not in seen:
            seen.add(fingerprint)
            unique.append(doc)

    tokenized_corpus = [doc.page_content.lower().split() for doc in unique]
    query_tokens = query.lower().split()

    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(query_tokens)

    ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    top_indices = ranked_indices[:_RERANK_TOP_N]

    reranked: list[Document] = []
    for idx in top_indices:
        doc = unique[idx]
        doc.metadata["bm25_score"] = round(float(scores[idx]), 4)
        reranked.append(doc)

    return reranked


# ── Stage 4: Context Assembly ─────────────────────────────────────────────────

def _clean_title(filename: str) -> str:
    name = os.path.splitext(filename)[0]
    return name.replace("_", " ").replace("-", " ").strip()


def _stage4_assemble_context(chunks: list[Document]) -> str:
    return "\n\n---\n\n".join(
        f"[{_clean_title(doc.metadata.get('document_name', 'Unknown'))}]\n{doc.page_content}"
        for doc in chunks
    )


# ── Stage 6: Response Generation ──────────────────────────────────────────────

def _stage6_build_citations(chunks: list[Document]) -> list[dict]:
    """Deduplicated, structured citations derived from the BM25-reranked chunks."""
    citations: list[dict] = []
    seen_keys: set[str] = set()
    for i, doc in enumerate(chunks):
        doc_id = doc.metadata.get("document_id", "")
        doc_name = doc.metadata.get("document_name", "Unknown")
        dedup_key = doc_id if doc_id else doc_name
        if dedup_key and dedup_key not in seen_keys:
            seen_keys.add(dedup_key)
            citations.append(
                {
                    "document_id": doc_id,
                    "document_name": _clean_title(doc_name),
                    "chunk_index": i,
                    "bm25_score": doc.metadata.get("bm25_score"),
                }
            )
    return citations


# ── Public entry points (stages 1-4+6 upfront, stage 5 token-by-token or invoked) ──

def _prepare_context_sync(query: str, metadata: dict | None = None) -> tuple[str, list[dict], str]:
    """Stages 1-4 + citations (stage 6). Returns (context, citations, rewritten_query)."""
    llm = ChatOpenAI(model=_CHAT_MODEL, temperature=0)
    rewritten = _stage1_process_query(query, llm, metadata)

    candidates = _stage2_retrieve(rewritten)
    if not candidates:
        return "", [], rewritten

    reranked_chunks = _stage3_rerank(rewritten, candidates)
    context = _stage4_assemble_context(reranked_chunks)
    citations = _stage6_build_citations(reranked_chunks)
    return context, citations, rewritten


async def prepare_context(query: str, metadata: dict | None = None) -> tuple[str, list[dict], str]:
    """Async wrapper for stages 1-4+6, run in a thread pool.

    `metadata` (e.g. conversation_id, user_id) is attached to LangSmith traces
    when LANGCHAIN_TRACING_V2 is enabled.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _prepare_context_sync, query, metadata)


def build_answer_chain():
    """LCEL chain for stage 5 that supports token-by-token .astream()."""
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", _SYSTEM_PROMPT),
            ("human", _RAG_TEMPLATE),
        ]
    )
    llm = ChatOpenAI(model=_CHAT_MODEL, temperature=0, streaming=True)
    return prompt | llm | StrOutputParser()
