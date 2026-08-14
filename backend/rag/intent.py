"""Lightweight intent detection — fast, deterministic checks that let the API
short-circuit the RAG pipeline (retrieval/rerank/LLM) for non-substantive
messages such as greetings, instead of returning "no relevant documents".
"""
import random
import re

_GREETING_PATTERN = re.compile(
    r"^(hi+|hey+|hello+|howdy|yo|greetings|good\s?(morning|afternoon|evening|day)|what'?s\s?up|sup)"
    r"\b[\s!.,]*(there|everyone|team)?[\s!.,]*$",
    re.IGNORECASE,
)

_GREETING_REPLIES = [
    "Hello! I'm your maintenance knowledge assistant. Ask me anything about your equipment, SOPs, or troubleshooting.",
    "Hi there! How can I help with your maintenance questions today?",
    "Hey! I'm ready to help — ask about any equipment, procedure, or document you've uploaded.",
]


def is_greeting(text: str) -> bool:
    """True if the message is only a greeting with no substantive question."""
    normalized = text.strip()
    if not normalized or len(normalized) > 40:
        return False
    return bool(_GREETING_PATTERN.match(normalized))


def greeting_reply() -> str:
    return random.choice(_GREETING_REPLIES)
