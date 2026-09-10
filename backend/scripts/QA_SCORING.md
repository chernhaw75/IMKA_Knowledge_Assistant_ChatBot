# QA Scoring Logic

The QA runner is `scripts/run_qa.py`. It compares each chatbot answer with the expected answer from the QA JSON file.

## 1. Extract important words

The script:

1. Converts both answers to lowercase.
2. Extracts words and numbers.
3. Removes common words such as `the`, `is`, `what`, `should`, and `to`.
4. Removes duplicate words.

For example:

```text
Expected: Turn the rotor 10 revolutions every two months.
```

The important tokens are approximately:

```text
rotor, 10, revolutions, every, two, months
```

## 2. Calculate the score

The score is the percentage of expected tokens found in the chatbot answer:

```text
score = matching expected tokens / total expected tokens
```

Example chatbot answer:

```text
Rotate the rotor 10 times every two months.
```

Matching tokens might be:

```text
rotor, 10, every, two, months
```

The score is therefore:

```text
5 / 6 = 0.83
```

The score is displayed as a decimal between `0.0` and `1.0`.

## 3. Conditions for passing

A question passes only when all three conditions are true:

```text
citations are present
AND score >= 0.55
AND the answer does not contain "No relevant documents"
```

The default threshold is `0.55`, or 55%.

To use another threshold:

```bash
python scripts/run_qa.py \
  /Users/tongchernhaw/Downloads/abb_motor_rag_100_qa.json \
  --threshold 0.70
```

## 4. Understanding the exit code

The runner returns:

- Exit code `0`: every question passed.
- Exit code `1`: the runner completed, but at least one question failed.
- Exit code `2`: the runner could not start or communicate with the API, for example invalid credentials or a missing QA file.

Exit code `1` does not necessarily mean the script crashed. It means the QA results contained one or more failures.

## 5. Inspect failed questions

When using `--output qa-results.json`, print only failed cases with:

```bash
python -c "import json; d=json.load(open('qa-results.json')); print('\\n'.join(f\"{r['id']}: score={r['score']} missing={r['missing_tokens']}\" for r in d['results'] if not r['passed']))"
```

The detailed output also contains:

- The original question
- The expected answer
- The chatbot answer
- The score
- Returned citations
- Missing expected tokens
- Any request error

## Limitations

This is a simple keyword-overlap score. It is not a semantic or human-quality evaluation.

It may:

- Penalize a correct answer that uses different wording.
- Reward an answer that repeats expected keywords without fully explaining the answer.
- Treat related words such as `revolutions` and `turning` as different words.
- Ignore answer quality, factual nuance, and whether the response is complete.

For a more reliable evaluation later, this runner could be extended with human review, embedding similarity, or an LLM-based judge.
