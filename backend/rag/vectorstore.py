import os

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore

from .qdrant_init import ensure_collection, get_qdrant_client

load_dotenv()

EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1024"))
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "ragindex")


def get_embeddings():
    """
    Return an OpenAIEmbeddings instance configured from environment.
    """
    if EMBEDDING_MODEL in ["text-embedding-3-small", "text-embedding-3-large"]:
        return OpenAIEmbeddings(model=EMBEDDING_MODEL, dimensions=EMBEDDING_DIMENSION)
    else:
        return OpenAIEmbeddings(model=EMBEDDING_MODEL)


def create_or_load_vectorstore(documents=None):
    embeddings = get_embeddings()
    client = get_qdrant_client()
    ensure_collection(client, QDRANT_COLLECTION_NAME, EMBEDDING_DIMENSION)

    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=QDRANT_COLLECTION_NAME,
        embedding=embeddings,
    )

    if documents:
        vectorstore.add_documents(documents)

    return vectorstore
