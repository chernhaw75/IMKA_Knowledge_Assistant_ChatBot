# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

IMKA Knowledge Assistant ChatBot — a Retrieval-Augmented Generation (RAG) system with a FastAPI backend and a React dashboard/chat frontend. There is also a legacy Streamlit single-page app in `backend/app.py` that combines ingestion + chat in one UI.

```
backend/     FastAPI API + Streamlit app, RAG pipeline (LangChain, Qdrant, OpenAI, Postgres)
frontend/    React + TypeScript + Vite dashboard/chat UI
```

## Common commands

### Infrastructure (Qdrant vector store + Postgres chat/user DB)

```bash
cd backend
docker compose up -d
```

Qdrant: `http://localhost:6333` (dashboard at `/dashboard`). Postgres: `localhost:5433`.

### Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
cp .env.example .env   # then fill in OPENAI_API_KEY etc.

uvicorn api.main:app --reload --port 8000   # FastAPI (serves the React frontend), docs at /docs
streamlit run app.py                         # legacy single-page ingestion+chat UI, http://localhost:8501
```

Direct CLI ingestion (bypasses the UI):

```bash
python -m ingest.embed_and_store path/to/document1.pdf path/to/document2.docx
python -m ingest.embed_and_store_docling path/to/document.pdf   # Docling pipeline, PDF only
```

There is no configured test suite in `backend/requirements.txt` (no pytest present) — verify backend changes by running the API and hitting endpoints (`/docs`) or via `python -m ingest...` for pipeline changes.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL, default http://localhost:8000

npm run dev       # http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run preview
```

No frontend test runner is configured.

### Windows convenience scripts

`start.bat` / `start.ps1` at the repo root launch the full stack (check them before assuming ports/services if debugging startup issues).

## Architecture

### Two ingestion pipelines, one vector store

Both pipelines write into the same Qdrant collection (`rag.vectorstore.create_or_load_vectorstore`) and the same JSON document registry (`ingest/registry.py` → `backend/data/documents_registry.json`), so results from either show up together:

- **Standard** (`ingest/embed_and_store.py`): `load_documents.py` (PDF/TXT/MD/DOCX loaders) → `chunk_documents.py` (RecursiveCharacterTextSplitter, `chunk_size=1000`, `chunk_overlap=200`) → embed → upsert. Chunk metadata carries a 0-indexed `page`.
- **Docling** (`ingest/embed_and_store_docling.py`): PDF-only. Uses Docling's `DocumentConverter` + `HybridChunker` for layout/table-aware, header-aware chunking (tables kept atomic, section headings tracked as `section_path`). Chunk metadata carries a 1-indexed `page_no`. Optionally captions figures/pictures via a VLM (`caption_figures=True`) so diagrams become retrievable text.

`FastAPI POST /api/documents` picks the pipeline via a `pipeline` form field (`"standard"` | `"docling"`); each has its own allowed file extensions.

Both attach `document_id`, `document_name`, `version`, plus caller-supplied metadata to every chunk — this is what downstream deletion (`DELETE /api/documents/{id}` filters Qdrant points by `metadata.document_id`) and citation display rely on.

### RAG pipeline (`backend/rag/pipeline.py`)

Six conceptual stages (stage numbering in comments skips 5, which is the LLM streaming call itself, done separately from context prep):

1. Query rewrite (LLM cleans/disambiguates the query for semantic search)
2. Retrieve — Qdrant similarity search, top `RETRIEVAL_TOP_K` (default 15)
3. BM25 rerank — dedupe by content fingerprint, then `rank_bm25` keyword rerank down to `RERANK_TOP_N` (default 5)
4. Context assembly — chunks labeled `[Document Name, p. N]` (page resolved via `_page_number`, which prefers Docling's `page_no` over PyPDFLoader's 0-indexed `page`)
5. Answer generation — separate LCEL chain (`build_answer_chain()`), streamed token-by-token via `.astream()`
6. Citations — deduplicated by `document_id`, built from the same reranked chunks as stage 4

Before the pipeline runs, `rag/intent.py` classifies the query as `greeting` / `capability` / `knowledge`; only `knowledge` triggers the full retrieval pipeline — the other two get a short LLM-written reply directly, skipping retrieval.

Everything is wired with LangSmith tracing metadata (`conversation_id`, `user_id`) passed through as `config={"metadata": ...}` on every chain invoke — enable via `LANGCHAIN_TRACING_V2=true` + `LANGCHAIN_API_KEY` in `.env`.

### Chat API is OpenAI-compatible

`backend/api/openai_compat.py` exposes `GET /v1/models` and `POST /v1/chat/completions` matching the OpenAI wire format (SSE streaming supported), so any OpenAI-compatible client can talk to it. Non-standard extensions used by the frontend: request `conversation_id`, response `message_id` and `citations`. Every exchange (user + assistant message, with citations JSON-encoded) is persisted to Postgres (`Conversation`/`Message` in `api/db_models.py`). `api/chat.py` only exposes the read path (`GET /api/history`) — chat itself always goes through `/v1/chat/completions`.

### Auth

JWT bearer auth (`api/auth.py`), `python-jose` + `bcrypt`. `get_current_user` (a FastAPI dependency) decodes the bearer token; used by both the chat and history endpoints. Tokens embed `user_id`, `email`, `name`, default expiry 1440 min (`JWT_EXPIRE_MINUTES`). No refresh-token flow.

### Frontend structure

- `lib/api.ts` — API client (talks to `VITE_API_URL`, defaults to `http://localhost:8000`)
- `lib/AuthContext.tsx`, `lib/ChatHistoryContext.tsx`, `lib/ThemeContext.tsx` — app-wide React contexts
- `components/layout/RequireAuth.tsx` — route guard wrapping all authenticated routes in `App.tsx`
- `components/chat/` — chat UI incl. `MarkdownContent.tsx` (renders assistant answers: `react-markdown` + `remark-gfm`/`remark-math` + `rehype-katex` for LaTeX, since the backend prompt instructs the LLM to emit Markdown/LaTeX) and `CitationsCard.tsx` (renders the `citations` array from chat responses)
- `components/dashboard/` — analytics/stats cards, currently backed by `data/mockData.ts` (not yet wired to a real backend endpoint — check before assuming dashboard data is live)
- `components/ui/` — shadcn-style primitives (Base UI + Tailwind + `class-variance-authority`)

Path alias `@/*` → `frontend/src/*` (see `tsconfig.app.json` / `vite.config.ts`).

## Environment configuration

Backend `.env` (see `backend/.env.example`): `OPENAI_API_KEY` (required), `QDRANT_URL`/`QDRANT_API_KEY`/`QDRANT_COLLECTION_NAME`, `DATABASE_URL` (Postgres), `JWT_SECRET`/`JWT_ALGORITHM`/`JWT_EXPIRE_MINUTES`, `OPENAI_EMBEDDING_MODEL`/`EMBEDDING_DIMENSION`, `OPENAI_CHAT_MODEL`, `ALLOWED_ORIGINS` (CORS), optional `LANGCHAIN_*` for LangSmith tracing. `EMBEDDING_DIMENSION` must match whatever the Qdrant collection was created with — changing it requires recreating the collection.

Frontend `.env`: `VITE_API_URL`.
