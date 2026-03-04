#!/usr/bin/env python3
"""
CAI Prep Course — Question Generation Pipeline
===============================================
Reads all lessons from Supabase, sends each lesson's content to Ollama
(qwen2.5-coder:32b) to generate 5-10 multiple choice questions, then inserts
them into the `cai_questions` table.

Each question includes:
  question_text, correct_answer, wrong_answers (3), explanation,
  difficulty (1-5), exam_domain, texas_law_reference (nullable)

Usage:
    python3 scripts/generate-questions.py               # All pending lessons
    python3 scripts/generate-questions.py --retry-failed # Retry failed only
    python3 scripts/generate-questions.py --limit 10     # At most N lessons
    python3 scripts/generate-questions.py --lesson <slug> # Single lesson
    python3 scripts/generate-questions.py --dry-run       # No API calls

Environment:
    SUPABASE_SERVICE_KEY   (required)
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SUPABASE_URL = "https://hthaomwoizcyfeduptqm.supabase.co"
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5-coder:32b"

QUESTIONS_PER_LESSON_MIN = 5
QUESTIONS_PER_LESSON_MAX = 10
COOLDOWN_SECONDS = 15
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 10

STATE_FILE = Path(__file__).parent / "generate-questions-progress.json"

SYSTEM_PROMPT = """You are a CAI (Community Association Institute) certification exam question writer.
Generate multiple choice questions from the provided lesson content.

Rules:
- Each question must test a concept relevant to the CAI certification exam
- Difficulty 1 = basic recall, 5 = complex application/analysis
- wrong_answers must be plausible but clearly incorrect
- explanation must clarify why the correct answer is right
- exam_domain should be a short label like "Governance", "Finance", "Operations", "Legal", "Ethics", "Maintenance", "Human Resources", "Community Relations"
- texas_law_reference: cite the Texas Property Code section (e.g., "Texas Property Code §209.006") if applicable, otherwise null
- Return ONLY a JSON array. No preamble, no explanation outside the JSON.

Return format (JSON array):
[
  {
    "question_text": "string",
    "correct_answer": "string",
    "wrong_answers": ["string", "string", "string"],
    "explanation": "string",
    "difficulty": 1,
    "exam_domain": "string",
    "texas_law_reference": null
  }
]"""


# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {"completed": {}, "failed": {}, "last_run": None}


def save_state(state: dict):
    state["last_run"] = datetime.utcnow().isoformat()
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def get_headers(service_key: str) -> dict:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def fetch_lessons(service_key: str, lesson_slug: str | None = None) -> list[dict]:
    headers = get_headers(service_key)

    params = {
        "select": "id,slug,title,content_markdown,key_points,texas_law_callouts,module_id,course_id",
        "order": "course_id,module_id,id",
        "limit": "1000",
    }
    if lesson_slug:
        params["slug"] = f"eq.{lesson_slug}"

    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/cai_lessons",
        headers=headers,
        params=params,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def fetch_existing_question_lesson_ids(service_key: str) -> set[int]:
    """Return lesson IDs that already have questions generated."""
    headers = get_headers(service_key)
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/cai_questions",
        headers=headers,
        params={"select": "lesson_id", "limit": "5000"},
        timeout=30,
    )
    if not resp.ok:
        return set()
    return {row["lesson_id"] for row in resp.json() if row.get("lesson_id")}


def insert_questions(service_key: str, questions: list[dict]) -> bool:
    """Bulk insert questions into cai_questions."""
    headers = get_headers(service_key)
    # Use upsert=false (plain insert) — duplicates raise an error if any
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/cai_questions",
        headers={**headers, "Prefer": "return=minimal"},
        json=questions,
        timeout=30,
    )
    if not resp.ok:
        print(f"    [warn] Insert failed ({resp.status_code}): {resp.text[:300]}")
    return resp.ok


# ---------------------------------------------------------------------------
# Content builder
# ---------------------------------------------------------------------------

def build_user_message(lesson: dict, num_questions: int) -> str:
    parts = [
        f"Lesson: {lesson.get('title', 'Untitled')}",
        f"Generate exactly {num_questions} multiple choice questions from the content below.",
        "",
        "## Lesson Content",
        lesson.get("content_markdown") or "(no content)",
    ]

    key_points = lesson.get("key_points") or []
    if key_points:
        parts += ["", "## Key Points (must test at least 2 of these)"]
        for kp in key_points:
            parts.append(f"- {kp}")

    texas_callouts = lesson.get("texas_law_callouts") or []
    if texas_callouts:
        parts += ["", "## Texas Law References (use in texas_law_reference field where relevant)"]
        for tc in texas_callouts:
            if isinstance(tc, dict):
                ref = tc.get("reference", tc.get("code", ""))
                desc = tc.get("description", tc.get("text", str(tc)))
                parts.append(f"- {ref}: {desc}" if ref else f"- {desc}")
            else:
                parts.append(f"- {tc}")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Ollama helpers
# ---------------------------------------------------------------------------

def call_ollama(user_message: str) -> list[dict] | None:
    """Call Ollama and parse the returned JSON array of questions."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "format": "json",
        "options": {
            "num_ctx": 4096,
            "temperature": 0.4,
        },
    }

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = requests.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                timeout=300,
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data.get("message", {}).get("content", "").strip()
            if not raw:
                print(f"    [warn] Empty response on attempt {attempt}")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_BACKOFF)
                continue

            parsed = parse_questions_json(raw)
            if parsed:
                return parsed

            print(f"    [warn] Could not parse JSON on attempt {attempt}. Raw: {raw[:200]}")
        except requests.exceptions.Timeout:
            print(f"    [warn] Ollama timeout on attempt {attempt}/{RETRY_ATTEMPTS}")
        except Exception as e:
            print(f"    [warn] Ollama error on attempt {attempt}: {e}")

        if attempt < RETRY_ATTEMPTS:
            time.sleep(RETRY_BACKOFF * attempt)

    return None


def parse_questions_json(raw: str) -> list[dict] | None:
    """
    Try multiple strategies to extract a JSON array from Ollama's response.
    Ollama with format=json sometimes wraps arrays in an object.
    """
    # Strategy 1: Direct parse
    try:
        obj = json.loads(raw)
        if isinstance(obj, list):
            return obj
        # Wrapped in an object — try common wrapper keys
        for key in ("questions", "data", "items", "results"):
            if isinstance(obj.get(key), list):
                return obj[key]
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract the first [...] array from the string
    match = re.search(r"\[[\s\S]*\]", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    # Strategy 3: Try to fix common issues (trailing commas before ])
    cleaned = re.sub(r",\s*]", "]", raw)
    cleaned = re.sub(r",\s*}", "}", cleaned)
    match = re.search(r"\[[\s\S]*\]", cleaned)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def validate_question(q: dict) -> dict | None:
    """
    Validate and normalize a single question object.
    Returns the cleaned question or None if it's unusable.
    """
    if not isinstance(q, dict):
        return None

    question_text = str(q.get("question_text", "")).strip()
    correct_answer = str(q.get("correct_answer", "")).strip()
    wrong_answers = q.get("wrong_answers", [])
    explanation = str(q.get("explanation", "")).strip()

    # Minimum viability
    if not question_text or not correct_answer:
        return None
    if not isinstance(wrong_answers, list) or len(wrong_answers) < 1:
        return None

    # Normalize wrong_answers to exactly 3 strings
    wrong_answers = [str(w).strip() for w in wrong_answers if str(w).strip()]
    # Pad to 3 if fewer returned
    while len(wrong_answers) < 3:
        wrong_answers.append(f"None of the above (option {len(wrong_answers) + 1})")
    wrong_answers = wrong_answers[:3]  # Cap at 3

    # Normalize difficulty to 1-5
    try:
        difficulty = int(q.get("difficulty", 2))
        difficulty = max(1, min(5, difficulty))
    except (ValueError, TypeError):
        difficulty = 2

    exam_domain = str(q.get("exam_domain", "General")).strip() or "General"
    texas_law_reference = q.get("texas_law_reference")
    if texas_law_reference is not None:
        texas_law_reference = str(texas_law_reference).strip() or None

    return {
        "question_text": question_text,
        "correct_answer": correct_answer,
        "wrong_answers": wrong_answers,
        "explanation": explanation,
        "difficulty": difficulty,
        "exam_domain": exam_domain,
        "texas_law_reference": texas_law_reference,
    }


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(args):
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("ERROR: SUPABASE_SERVICE_KEY environment variable is not set.")
        sys.exit(1)

    state = load_state()

    print("Fetching lessons from Supabase...")
    try:
        lessons = fetch_lessons(service_key, lesson_slug=args.lesson)
    except Exception as e:
        print(f"ERROR fetching lessons: {e}")
        sys.exit(1)

    if not lessons:
        print("No lessons found.")
        return

    print(f"Found {len(lessons)} lesson(s).")

    # Filter based on mode
    if args.retry_failed:
        lessons = [l for l in lessons if l["slug"] in state["failed"]]
        print(f"Retry mode: {len(lessons)} failed lesson(s).")
    else:
        if not args.lesson:
            # Skip lessons that are already in state OR already have questions in DB
            print("Checking which lessons already have questions...")
            try:
                existing_ids = fetch_existing_question_lesson_ids(service_key)
            except Exception:
                existing_ids = set()

            lessons = [
                l for l in lessons
                if l["slug"] not in state["completed"]
                and l["id"] not in existing_ids
            ]
            print(f"Pending (no questions yet): {len(lessons)} lesson(s).")

    if args.limit:
        lessons = lessons[: args.limit]
        print(f"Limited to {len(lessons)} by --limit.")

    if not lessons:
        print("Nothing to do.")
        print(f"  Completed: {len(state['completed'])}, Failed: {len(state['failed'])}")
        return

    total = len(lessons)
    success_count = 0
    fail_count = 0
    total_questions_inserted = 0
    start_time = time.time()

    for idx, lesson in enumerate(lessons, 1):
        slug = lesson["slug"]
        title = lesson.get("title", slug)
        lesson_id = lesson["id"]
        module_id = lesson.get("module_id")
        course_id = lesson.get("course_id")

        elapsed = time.time() - start_time
        eta_str = ""
        if idx > 1:
            avg = elapsed / (idx - 1)
            remaining = avg * (total - idx + 1)
            eta_str = f" | ETA {remaining / 60:.1f}m"

        print(f"\n[{idx}/{total}] {slug}: {title}{eta_str}")

        if not lesson.get("content_markdown"):
            print("  [skip] No content_markdown available.")
            state["failed"][slug] = {
                "error": "no content_markdown",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            continue

        # Vary question count slightly for variety across lessons
        # Use lesson index to distribute evenly between min and max
        num_questions = QUESTIONS_PER_LESSON_MIN + (idx % (QUESTIONS_PER_LESSON_MAX - QUESTIONS_PER_LESSON_MIN + 1))

        if args.dry_run:
            print(f"  [dry-run] Would generate {num_questions} questions via Ollama.")
            continue

        user_message = build_user_message(lesson, num_questions)
        print(f"  Sending to Ollama (requesting {num_questions} questions, {len(user_message)} chars input)...")

        raw_questions = call_ollama(user_message)
        if not raw_questions:
            print(f"  [FAIL] Ollama returned no questions.")
            state["failed"][slug] = {
                "error": "ollama returned no questions",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                print(f"  Cooling down {COOLDOWN_SECONDS}s...")
                time.sleep(COOLDOWN_SECONDS)
            continue

        # Validate and attach FK fields
        valid_questions = []
        for q in raw_questions:
            cleaned = validate_question(q)
            if cleaned:
                cleaned["lesson_id"] = lesson_id
                cleaned["module_id"] = module_id
                cleaned["course_id"] = course_id
                valid_questions.append(cleaned)

        skipped = len(raw_questions) - len(valid_questions)
        if skipped:
            print(f"  Dropped {skipped} malformed question(s) from Ollama response.")

        if not valid_questions:
            print(f"  [FAIL] All generated questions were invalid.")
            state["failed"][slug] = {
                "error": "all questions invalid after validation",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                time.sleep(COOLDOWN_SECONDS)
            continue

        print(f"  Inserting {len(valid_questions)} question(s) into Supabase...")
        ok = insert_questions(service_key, valid_questions)

        if not ok:
            print(f"  [FAIL] Supabase insert failed.")
            state["failed"][slug] = {
                "error": "supabase insert failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
        else:
            print(f"  [OK] {len(valid_questions)} question(s) inserted.")
            state["completed"][slug] = {
                "lesson_id": lesson_id,
                "questions_inserted": len(valid_questions),
                "timestamp": datetime.utcnow().isoformat(),
            }
            state["failed"].pop(slug, None)
            success_count += 1
            total_questions_inserted += len(valid_questions)

        save_state(state)

        if idx < total:
            print(f"  Cooling down {COOLDOWN_SECONDS}s...")
            time.sleep(COOLDOWN_SECONDS)

    total_elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("Question Generation Pipeline — Done")
    print(f"  Lessons processed : {success_count} OK, {fail_count} failed")
    print(f"  Questions inserted: {total_questions_inserted}")
    print(f"  Avg per lesson    : {total_questions_inserted / max(success_count, 1):.1f}")
    print(f"  Time              : {total_elapsed / 60:.1f}m")
    print(f"  State             : {STATE_FILE}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="CAI Prep Course — Question Generation Pipeline"
    )
    parser.add_argument("--retry-failed", action="store_true", help="Retry failed lessons")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N lessons")
    parser.add_argument("--lesson", type=str, default=None, help="Process single lesson by slug")
    parser.add_argument("--dry-run", action="store_true", help="Print plan, no API calls or inserts")
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()
