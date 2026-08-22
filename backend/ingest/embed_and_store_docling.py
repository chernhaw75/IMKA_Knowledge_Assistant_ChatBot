"""
Docling-based ingestion pipeline (alternative to ingest/embed_and_store.py).

Parses PDFs with Docling (layout + table structure aware), chunks them with
Docling's HybridChunker (header-aware, table-atomic, token-budget aware),
optionally captions figures with a VLM, then reuses this app's existing
embedding config and Qdrant collection (rag.vectorstore.create_or_load_vectorstore)
and document registry (ingest.registry.add_document) so results show up
alongside documents ingested via the existing pipeline.

This module does not replace ingest/embed_and_store.py — call ingest_files_docling()
explicitly when you want the Docling path; the existing ingest_files() is untouched.

Requires: pip install docling  (see requirements.txt)
"""

import base64
import io
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document

from ingest.registry import add_document
from rag.vectorstore import create_or_load_vectorstore

load_dotenv()

CHUNK_MAX_TOKENS = int(os.getenv("DOCLING_CHUNK_MAX_TOKENS", "700"))
VLM_CAPTION_MODEL = os.getenv("DOCLING_CAPTION_MODEL", "gpt-4o-mini")


def _parse_pdf(pdf_path: str):
    """Layout-aware parse: returns Docling's DoclingDocument with structure
    (headings, tables as structured objects, figure regions) intact."""
    from docling.document_converter import DocumentConverter

    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    return result.document


def _chunk_document(doc, source_path: str) -> list[Document]:
    """
    HybridChunker walks the DoclingDocument tree, merges small runs under
    their heading path, keeps tables as single atomic chunks, and respects
    a max token budget per chunk. Returned as langchain Documents so they
    can flow through the same vectorstore/registry as the existing pipeline.
    """
    from docling.chunking import HybridChunker

    chunker = HybridChunker(max_tokens=CHUNK_MAX_TOKENS)

    chunks: list[Document] = []
    for raw_chunk in chunker.chunk(doc):
        meta = raw_chunk.meta
        headings = getattr(meta, "headings", None) or []
        section_path = " > ".join(headings) if headings else ""

        page_no = None
        doc_items = getattr(meta, "doc_items", None) or []
        for item in doc_items:
            prov = getattr(item, "prov", None)
            if prov:
                page_no = prov[0].page_no
                break

        chunk_type = "text"
        for item in doc_items:
            label = str(getattr(item, "label", "")).lower()
            if "table" in label:
                chunk_type = "table"
                break

        chunks.append(Document(
            page_content=raw_chunk.text,
            metadata={
                "source": source_path,
                "page_no": page_no,
                "section_path": section_path,
                "chunk_type": chunk_type,
            },
        ))

    return chunks


def _caption_figures(doc, source_path: str) -> list[Document]:
    """
    OpenAI text embeddings can't see images. Pull figure/picture regions out
    of the DoclingDocument, get a crop, and ask a VLM to describe it in
    words a retriever can match against. Skip if the doc has no pictures.
    """
    from openai import OpenAI

    client = OpenAI()
    figure_chunks: list[Document] = []

    pictures = getattr(doc, "pictures", None) or []
    if not pictures:
        return figure_chunks

    for i, pic in enumerate(pictures):
        try:
            pil_image = pic.get_image(doc)
        except Exception as e:
            print(f"  [warn] could not extract image {i}: {e}", file=sys.stderr)
            continue
        if pil_image is None:
            continue

        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        page_no = None
        prov = getattr(pic, "prov", None)
        if prov:
            page_no = prov[0].page_no

        try:
            resp = client.chat.completions.create(
                model=VLM_CAPTION_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": (
                            "Describe this technical diagram/figure precisely and "
                            "factually, in 2-4 sentences. Name the components, callout "
                            "numbers, and what the figure illustrates (e.g. wiring "
                            "diagram, rating plate, dimension drawing). Do not "
                            "speculate beyond what is visibly labeled."
                        )},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    ],
                }],
                max_tokens=250,
            )
            caption = resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"  [warn] captioning failed for figure {i}: {e}", file=sys.stderr)
            continue

        figure_chunks.append(Document(
            page_content=f"[Figure, page {page_no}] {caption}",
            metadata={
                "source": source_path,
                "page_no": page_no,
                "section_path": "",
                "chunk_type": "figure",
            },
        ))

    return figure_chunks


def _attach_metadata(chunks: list[Document], document_id: str, document_name: str, version: str, metadata: dict):
    for chunk in chunks:
        chunk.metadata.update({
            "document_id": document_id,
            "document_name": document_name,
            "version": version,
            **metadata,
        })
    return chunks


def ingest_files_docling(
    file_paths: list[str],
    metadata: dict[str, str] | None = None,
    version: str = "1.0",
    original_names: list[str] | None = None,
    caption_figures: bool = False,
):
    """Docling-based alternative to ingest.embed_and_store.ingest_files.

    Parses each PDF with Docling (layout + table structure aware), chunks
    with HybridChunker (header-aware, table-atomic, token-budget aware),
    optionally captions figures with a VLM, and stores in the same Qdrant
    collection / document registry as the existing ingestion pipeline.

    Only PDF files are supported (Docling's layout/table analysis targets
    PDFs); pass files of other types through ingest.embed_and_store.ingest_files
    instead.

    Args:
        file_paths: Paths to PDF documents to ingest.
        metadata: Arbitrary key-value tags attached to every chunk of every
            document (e.g. department, classification) — caller-defined.
        version: Document version string.
        original_names: Human-readable file names to record as document_name,
            parallel to file_paths. Defaults to each path's own file name —
            pass this when file_paths point at temp files with generated names.
        caption_figures: If True, run each figure/picture through a VLM and
            add the caption as its own retrievable chunk.
    """
    metadata = metadata or {}
    if original_names is None:
        original_names = [Path(p).name for p in file_paths]

    for path in file_paths:
        if Path(path).suffix.lower() != ".pdf":
            raise ValueError(f"Docling ingestion only supports PDF files, got: {path}")

    all_chunks: list[Document] = []
    document_records = []

    for path, doc_name in zip(file_paths, original_names):
        print(f"Parsing {doc_name} with Docling...")
        doc = _parse_pdf(path)

        print("Chunking (header-aware, table-atomic)...")
        path_chunks = _chunk_document(doc, source_path=path)
        print(f"  -> {len(path_chunks)} text/table chunks")

        if caption_figures:
            print("Captioning figures with VLM...")
            fig_chunks = _caption_figures(doc, source_path=path)
            print(f"  -> {len(fig_chunks)} figure chunks")
            path_chunks.extend(fig_chunks)

        doc_id = str(uuid.uuid4())
        _attach_metadata(path_chunks, document_id=doc_id, document_name=doc_name, version=version, metadata=metadata)
        document_records.append({"document_id": doc_id, "document_name": doc_name, "chunk_count": len(path_chunks)})
        all_chunks.extend(path_chunks)

    if not all_chunks:
        print("⚠️ No chunks produced.")
        return None

    print(f"Uploading {len(all_chunks)} chunks to Qdrant...")
    create_or_load_vectorstore(documents=all_chunks)
    print("✅ Docling ingestion successfully completed.")

    for record in document_records:
        add_document(
            document_id=record["document_id"],
            document_name=record["document_name"],
            version=version,
            metadata=metadata,
            chunk_count=record["chunk_count"],
        )

    return {"total_chunks": len(all_chunks), "documents": document_records}


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m ingest.embed_and_store_docling <file1.pdf> [file2.pdf ...]")
        print("  Env vars: VERSION, METADATA (JSON object string), CAPTION_FIGURES (1/0)")
        return

    import json
    paths = [str(Path(p)) for p in sys.argv[1:]]
    try:
        result = ingest_files_docling(
            paths,
            metadata=json.loads(os.getenv("METADATA", "{}")),
            version=os.getenv("VERSION", "1.0"),
            caption_figures=os.getenv("CAPTION_FIGURES", "0") == "1",
        )
        if result:
            print(f"Total chunks indexed: {result['total_chunks']}")
    except Exception as e:
        print(f"❌ Error during ingestion: {e}")


if __name__ == "__main__":
    main()
