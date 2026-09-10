"""Run the ABB knowledge-base question/answer evaluation set.

Example:
    QA_EMAIL=test@example.com QA_PASSWORD=... \
        python scripts/run_qa.py /path/to/abb_motor_rag_100_qa.json
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_THRESHOLD = 0.55
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "can", "for", "from",
    "how", "in", "is", "it", "of", "on", "or", "should", "that", "the", "their",
    "this", "to", "what", "when", "where", "which", "who", "with", "why",
}


def request_json(url: str, payload: dict, headers: dict | None = None) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} from {url}: {detail}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach {url}: {error.reason}") from error


def get_token(api_url: str, token: str | None, email: str | None, password: str | None) -> str:
    if token:
        return token
    if not email or not password:
        raise RuntimeError("Set QA_TOKEN or both QA_EMAIL and QA_PASSWORD.")
    response = request_json(
        f"{api_url}/api/auth/login",
        {"email": email, "password": password},
    )
    return response["access_token"]


def content_tokens(text: str) -> set[str]:
    tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
    return {token for token in tokens if token not in STOP_WORDS and len(token) > 1}


def score_answer(expected: str, actual: str) -> tuple[float, set[str]]:
    expected_tokens = content_tokens(expected)
    actual_tokens = content_tokens(actual)
    if not expected_tokens:
        return 1.0, set()
    matched = expected_tokens & actual_tokens
    return len(matched) / len(expected_tokens), expected_tokens - matched


def ask(
    api_url: str, token: str, question: str, conversation_id: str | None
) -> tuple[str, list[dict], str | None]:
    response = request_json(
        f"{api_url}/v1/chat/completions",
        {
            "model": "rag-pipeline",
            "messages": [{"role": "user", "content": question}],
            "stream": False,
            "conversation_id": conversation_id,
        },
        {"Authorization": f"Bearer {token}"},
    )
    choice = response.get("choices", [{}])[0]
    return (
        choice.get("message", {}).get("content", ""),
        response.get("citations", []),
        response.get("conversation_id"),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate the IMKA RAG chatbot against a JSON QA set.")
    parser.add_argument("qa_file", type=Path, help="JSON file containing question and answer fields")
    parser.add_argument("--api-url", default=os.getenv("QA_API_URL", DEFAULT_API_URL))
    parser.add_argument("--token", default=os.getenv("QA_TOKEN"))
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--output", type=Path, help="Optional path for detailed JSON results")
    args = parser.parse_args()

    cases = json.loads(args.qa_file.read_text(encoding="utf-8"))
    if not isinstance(cases, list) or not cases:
        raise RuntimeError("QA file must contain a non-empty JSON array.")

    token = get_token(args.api_url.rstrip("/"), args.token, os.getenv("QA_EMAIL"), os.getenv("QA_PASSWORD"))
    conversation_id = None
    results = []

    for index, case in enumerate(cases, start=1):
        question = case["question"]
        expected = case["answer"]
        try:
            actual, citations, response_conversation_id = ask(
                args.api_url.rstrip("/"), token, question, conversation_id
            )
            conversation_id = response_conversation_id or conversation_id
            score, missing = score_answer(expected, actual)
            passed = bool(citations) and score >= args.threshold and "no relevant documents" not in actual.lower()
            error = None
        except Exception as exc:  # Keep the rest of the evaluation running.
            actual, citations, score, missing, passed = "", [], 0.0, set(), False
            error = str(exc)

        result = {
            "id": case.get("id", index),
            "question": question,
            "expected": expected,
            "actual": actual,
            "score": round(score, 3),
            "citations": citations,
            "passed": passed,
            "missing_tokens": sorted(missing),
            "error": error,
        }
        results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {index}/{len(cases)} score={score:.2f} {question}")
        if not passed and error:
            print(f"       error: {error}")

    passed_count = sum(result["passed"] for result in results)
    summary = {
        "total": len(results),
        "passed": passed_count,
        "failed": len(results) - passed_count,
        "pass_rate": round(passed_count / len(results), 3),
        "threshold": args.threshold,
        "results": results,
    }
    if args.output:
        args.output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"Detailed results written to {args.output}")
    print(f"\nSummary: {passed_count}/{len(results)} passed ({summary['pass_rate']:.1%})")
    return 0 if passed_count == len(results) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, OSError, RuntimeError, json.JSONDecodeError) as error:
        print(f"QA error: {error}", file=sys.stderr)
        raise SystemExit(2)