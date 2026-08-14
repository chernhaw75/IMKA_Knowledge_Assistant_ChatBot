# RAG Data Pipeline & Chat Dashboard

A complete, production-ready Retrieval-Augmented Generation (RAG) data pipeline and chat application built using **LangChain**, **Qdrant**, **OpenAI**, **FastAPI**, and **Streamlit**.

---

## Features

- **Multi-Format Document Parsing**: Upload and parse **PDF**, **TXT**, **MD**, and **Word Document (DOCX)** files.
- **Recursive Text Splitter**: Intelligently chunks files with contextual overlapping (`chunk_size=1000`, `chunk_overlap=200`).
- **Qdrant Vector Store**: Runs locally via Docker; auto-creates the collection and upserts embedded chunks.
- **FastAPI Backend**: HTTP API (`/api/documents`, `/api/health`) for external frontends (e.g. the React dashboard) to drive ingestion.
- **Streamlit Single-Page UI**: An elegant, unified frontend for both the data ingestion pipeline and real-time streaming chatbot.
- **Pre-configured Keys**: Automatically loads your existing keys from the `.env` file.

---

## Project Structure

```text
backend/
├── app.py               # Unified Streamlit application (UI & Chat/Ingest orchestration)
├── docker-compose.yml   # Local Qdrant vector database
├── requirements.txt     # Python dependency list
├── .env                 # Secret key configuration (OpenAI, Qdrant)
├── .env.example          # Configuration template
├── .gitignore            # File exclude rules
├── api/
│   ├── main.py           # FastAPI app: /api/documents, /api/health
│   └── schemas.py        # Pydantic response models
├── ingest/
│   ├── __init__.py
│   ├── chunk_documents.py # Recursive text splitter
│   ├── embed_and_store.py # Ingestion pipeline engine
│   ├── load_documents.py  # PDF, TXT, and DOCX document loaders
│   └── registry.py        # JSON-backed document registry (for listing/deleting)
└── rag/
    ├── __init__.py
    ├── qdrant_init.py     # Qdrant client + collection creator
    ├── retrieval_chain.py # LangChain LCEL RAG execution chain
    └── vectorstore.py     # Embeddings helper & Vector store mapping
```

---

## Setup & Running

Follow these simple steps to run this project:

### 1. Start Qdrant

```powershell
docker compose up -d
```

Qdrant is now reachable at `http://localhost:6333` (dashboard at `http://localhost:6333/dashboard`).

### 2. Create a Virtual Environment

Open your terminal in the project directory:

```powershell
python -m venv .venv
```

### 3. Activate the Virtual Environment

```powershell
.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 5. Running the Dashboard

Launch the single-page Streamlit application:

```powershell
streamlit run app.py
```

Streamlit will automatically open your default browser at **http://localhost:8501**.

### 6. Running the API (for the React frontend)

```powershell
uvicorn api.main:app --reload --port 8000
```

The API is now reachable at **http://localhost:8000** (interactive docs at `/docs`).

---

## Direct CLI Ingestion (Alternative)

If you'd like to run the ingestion pipeline via the command line instead of the UI, you can do so directly:

```powershell
python -m ingest.embed_and_store path/to/document1.pdf path/to/document2.docx
```
