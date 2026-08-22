"""LLM-based intent detection — classifies the user's message before it reaches
the RAG pipeline, so non-substantive messages (greetings, meta questions about
the assistant) get a short LLM-written reply immediately instead of an
unnecessary retrieval/rerank/answer pass through the knowledge base.
"""
import asyncio
import os
from typing import Literal

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

load_dotenv()

_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

_SYSTEM_PROMPT = (
    "You are the front-door intent classifier for a maintenance knowledge assistant chatbot.\n"
    "Classify the user's message as exactly one of:\n"
    "- 'greeting': a hello/hi/small talk with no substantive question.\n"
    "- 'capability': a meta question about what the assistant can do or how it works.\n"
    "- 'knowledge': a substantive question that should be answered from the maintenance knowledge base "
    "(equipment, SOPs, troubleshooting, documents, etc).\n\n"
    "If the intent is 'greeting' or 'capability', also write `reply`: a short, friendly, 1-3 sentence "
    "answer that addresses the message directly, without needing to search any documents. "
    "For 'capability', mention that you answer questions about equipment, SOPs, and troubleshooting "
    "from the uploaded knowledge base.\n"
    "If the intent is 'knowledge', leave `reply` empty — it will be answered separately using retrieved context."
)


class Intent(BaseModel):
    intent: Literal["greeting", "capability", "knowledge"] = Field(
        description="The classified intent of the user's message."
    )
    reply: str = Field(
        default="",
        description="Short direct reply for 'greeting'/'capability' intents; empty for 'knowledge'.",
    )


def _classify_sync(query: str, metadata: dict | None = None) -> Intent:
    llm = ChatOpenAI(model=_CHAT_MODEL, temperature=0)
    structured_llm = llm.with_structured_output(Intent)
    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM_PROMPT), ("human", "{query}")])
    chain = prompt | structured_llm
    return chain.invoke(
        {"query": query},
        config={"run_name": "intent_classification", "tags": ["intent"], "metadata": metadata or {}},
    )


async def classify_intent(query: str, metadata: dict | None = None) -> Intent:
    """Sends the user's question to the LLM for intent classification, run in a thread pool.

    `metadata` (e.g. conversation_id, user_id) is attached to the LangSmith trace when
    LANGCHAIN_TRACING_V2 is enabled, so a run can be traced back to its conversation.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _classify_sync, query, metadata)
