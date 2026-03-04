#!/usr/bin/env python3
"""
CAI Prep Course — Content Polish Pipeline
==========================================
Reads all 228 lessons from Supabase, sends each lesson's content to Ollama
(qwen2.5-coder:32b) for editing, then writes the polished markdown back to
Supabase.

Usage:
    python3 scripts/content-polish.py               # Process all pending lessons
    python3 scripts/content-polish.py --retry-failed # Retry only failed lessons
    python3 scripts/content-polish.py --limit 10     # Process at most N lessons
    python3 scripts/content-polish.py --lesson <slug> # Process a single lesson
"""

import argparse
import json
import os
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

COOLDOWN_SECONDS = 15
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 10  # seconds

STATE_FILE = Path(__file__).parent / "content-polish-progress.json"

SYSTEM_PROMPT = (
    "You are an expert editor for CAI (Community Association Institute) certification prep "
    "materials. Edit this lesson for clarity, add Texas-specific examples where relevant, "
    "fix AI-sounding phrases, tighten exam-relevant key points. Return the FULL edited "
    "content in markdown format. Do NOT add any preamble or explanation — return ONLY the "
    "edited markdown content."
)

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
    """Fetch all lessons with their module and course info."""
    headers = get_headers(service_key)

    # Fetch lessons
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
    lessons = resp.json()

    if not lessons:
        return []

    # Fetch course info for context
    course_ids = list({l["course_id"] for l in lessons if l.get("course_id")})
    courses = {}
    if course_ids:
        course_resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/cai_courses",
            headers=headers,
            params={"select": "id,slug,title,credential_code", "id": f"in.({','.join(str(c) for c in course_ids)})"},
            timeout=30,
        )
        if course_resp.ok:
            for c in course_resp.json():
                courses[c["id"]] = c

    # Enrich lessons with course info
    for lesson in lessons:
        lesson["_course"] = courses.get(lesson.get("course_id"), {})

    return lessons


def patch_lesson(service_key: str, lesson_id: int, content_markdown: str) -> bool:
    """Write polished content back to Supabase."""
    headers = get_headers(service_key)
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/cai_lessons",
        headers=headers,
        params={"id": f"eq.{lesson_id}"},
        json={"content_markdown": content_markdown},
        timeout=30,
    )
    return resp.ok


# ---------------------------------------------------------------------------
# Ollama helpers
# ---------------------------------------------------------------------------

def build_user_message(lesson: dict) -> str:
    """Construct the message to send to Ollama for polishing."""
    course = lesson.get("_course", {})
    course_name = course.get("title", "CAI Certification")
    credential = course.get("credential_code", "")

    parts = [
        f"# Lesson: {lesson.get('title', 'Untitled')}",
        f"Course: {course_name}" + (f" ({credential})" if credential else ""),
        "",
        "## Current Content",
        lesson.get("content_markdown") or "(no content yet)",
    ]

    key_points = lesson.get("key_points") or []
    if key_points:
        parts += ["", "## Key Points", ""]
        for kp in key_points:
            parts.append(f"- {kp}")

    texas_callouts = lesson.get("texas_law_callouts") or []
    if texas_callouts:
        parts += ["", "## Texas Law Callouts", ""]
        for tc in texas_callouts:
            if isinstance(tc, dict):
                ref = tc.get("reference", tc.get("code", ""))
                desc = tc.get("description", tc.get("text", str(tc)))
                parts.append(f"- **{ref}**: {desc}" if ref else f"- {desc}")
            else:
                parts.append(f"- {tc}")

    return "\n".join(parts)


def call_ollama(user_message: str) -> str | None:
    """Send content to Ollama and return the polished markdown."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "options": {
            "num_ctx": 4096,
            "temperature": 0.3,
        },
    }

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = requests.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
                timeout=300,  # 5 min max per lesson
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get("message", {}).get("content", "").strip()
            if content:
                return content
            print(f"    [warn] Empty response from Ollama on attempt {attempt}")
        except requests.exceptions.Timeout:
            print(f"    [warn] Ollama timeout on attempt {attempt}/{RETRY_ATTEMPTS}")
        except Exception as e:
            print(f"    [warn] Ollama error on attempt {attempt}/{RETRY_ATTEMPTS}: {e}")

        if attempt < RETRY_ATTEMPTS:
            wait = RETRY_BACKOFF * attempt
            print(f"    Retrying in {wait}s...")
            time.sleep(wait)

    return None


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(args):
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("ERROR: SUPABASE_SERVICE_KEY environment variable is not set.")
        print("  Set it with: export SUPABASE_SERVICE_KEY=your_service_key")
        sys.exit(1)

    state = load_state()

    # Fetch lessons
    print(f"Fetching lessons from Supabase...")
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
        print(f"Retry mode: {len(lessons)} failed lesson(s) to retry.")
    else:
        # Skip already completed (unless single-lesson mode)
        if not args.lesson:
            lessons = [l for l in lessons if l["slug"] not in state["completed"]]
            print(f"Pending (not yet polished): {len(lessons)} lesson(s).")

    if args.limit:
        lessons = lessons[: args.limit]
        print(f"Limited to {len(lessons)} lesson(s) by --limit flag.")

    if not lessons:
        print("Nothing to do. All lessons are already polished.")
        print(f"  Completed: {len(state['completed'])}, Failed: {len(state['failed'])}")
        return

    total = len(lessons)
    success_count = 0
    fail_count = 0
    start_time = time.time()

    for idx, lesson in enumerate(lessons, 1):
        slug = lesson["slug"]
        title = lesson.get("title", slug)
        elapsed = time.time() - start_time
        eta_str = ""
        if idx > 1:
            avg = elapsed / (idx - 1)
            remaining = avg * (total - idx + 1)
            eta_str = f" | ETA {remaining / 60:.1f}m"

        print(f"\n[{idx}/{total}] {slug}: {title}{eta_str}")

        if not lesson.get("content_markdown"):
            print("  [skip] No content_markdown to polish.")
            state["failed"][slug] = {
                "error": "no content_markdown",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            continue

        user_message = build_user_message(lesson)
        print(f"  Sending to Ollama ({len(user_message)} chars)...")

        polished = call_ollama(user_message)
        if not polished:
            print(f"  [FAIL] Could not get polished content from Ollama.")
            state["failed"][slug] = {
                "error": "ollama returned no content",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                print(f"  Cooling down {COOLDOWN_SECONDS}s...")
                time.sleep(COOLDOWN_SECONDS)
            continue

        print(f"  Received {len(polished)} chars. Writing to Supabase...")
        ok = patch_lesson(service_key, lesson["id"], polished)
        if not ok:
            print(f"  [FAIL] Supabase PATCH failed for lesson {lesson['id']}.")
            state["failed"][slug] = {
                "error": "supabase patch failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
        else:
            print(f"  [OK] Polished and saved.")
            state["completed"][slug] = {
                "lesson_id": lesson["id"],
                "chars_in": len(lesson.get("content_markdown") or ""),
                "chars_out": len(polished),
                "timestamp": datetime.utcnow().isoformat(),
            }
            state["failed"].pop(slug, None)
            success_count += 1

        save_state(state)

        if idx < total:
            print(f"  Cooling down {COOLDOWN_SECONDS}s...")
            time.sleep(COOLDOWN_SECONDS)

    total_elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("Content Polish Pipeline — Done")
    print(f"  Success : {success_count}")
    print(f"  Failed  : {fail_count}")
    print(f"  Total   : {total}")
    print(f"  Time    : {total_elapsed / 60:.1f}m")
    print(f"  State   : {STATE_FILE}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="CAI Prep Course — Content Polish Pipeline"
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="Only retry lessons that previously failed",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process at most N lessons",
    )
    parser.add_argument(
        "--lesson",
        type=str,
        default=None,
        help="Process a single lesson by slug",
    )
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()
