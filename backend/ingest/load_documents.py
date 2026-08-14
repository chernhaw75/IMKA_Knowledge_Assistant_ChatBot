import os
from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader


def load_pdf(path: str) -> List[Document]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    return PyPDFLoader(path).load()


def load_txt(path: str) -> List[Document]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    return TextLoader(path, encoding="utf-8").load()


def load_docx(path: str) -> List[Document]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    return Docx2txtLoader(path).load()


def load_documents_from_paths(paths: List[str]) -> List[Document]:
    docs = []
    for path in paths:
        ext = os.path.splitext(path)[1].lower()
        if ext == ".pdf":
            docs.extend(load_pdf(path))
        elif ext in [".txt", ".md"]:
            docs.extend(load_txt(path))
        elif ext in [".docx", ".doc"]:
            docs.extend(load_docx(path))
        else:
            raise ValueError(f"Unsupported file format: {ext} for path: {path}")
    return docs
