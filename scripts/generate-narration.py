#!/usr/bin/env python3
"""
CAI Prep Course — Narration Generation Pipeline
================================================
Reads all lessons from Supabase, converts content_markdown to speech via
ElevenLabs TTS (voice: Rachel), uploads the resulting MP3 to Supabase
Storage bucket `cai-audio`, then writes the audio_url back to the lesson row.

Long lessons (>5000 chars) are split into chunks, synthesized individually,
and concatenated before upload.

Usage:
    python3 scripts/generate-narration.py               # All pending lessons
    python3 scripts/generate-narration.py --retry-failed # Retry failed only
    python3 scripts/generate-narration.py --limit 5      # At most N lessons
    python3 scripts/generate-narration.py --lesson <slug> # Single lesson
    python3 scripts/generate-narration.py --dry-run       # No API calls

Environment:
    SUPABASE_SERVICE_KEY   (required)
    ELEVENLABS_API_KEY     (required)
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
STORAGE_BUCKET = "cai-audio"

ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel — professional female
ELEVENLABS_TTS_URL = (
    f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
)
ELEVENLABS_CHUNK_LIMIT = 4800  # chars — safe margin below the 5000 limit

COOLDOWN_SECONDS = 5  # ElevenLabs is fast; short cooldown
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 10

STATE_FILE = Path(__file__).parent / "generate-narration-progress.json"

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

def get_sb_headers(service_key: str) -> dict:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def fetch_lessons(service_key: str, lesson_slug: str | None = None) -> list[dict]:
    headers = get_sb_headers(service_key)
    params = {
        "select": "id,slug,title,content_markdown,audio_url,module_id,course_id",
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

    # Enrich with course slugs for storage path
    course_ids = list({l["course_id"] for l in lessons if l.get("course_id")})
    course_map = {}
    if course_ids:
        cr = requests.get(
            f"{SUPABASE_URL}/rest/v1/cai_courses",
            headers=headers,
            params={
                "select": "id,slug",
                "id": f"in.({','.join(str(c) for c in course_ids)})",
            },
            timeout=30,
        )
        if cr.ok:
            for c in cr.json():
                course_map[c["id"]] = c

    for lesson in lessons:
        lesson["_course"] = course_map.get(lesson.get("course_id"), {})

    return lessons


def ensure_bucket(service_key: str) -> bool:
    headers = get_sb_headers(service_key)
    resp = requests.get(
        f"{SUPABASE_URL}/storage/v1/bucket/{STORAGE_BUCKET}",
        headers=headers,
        timeout=15,
    )
    if resp.status_code == 200:
        return True
    create_resp = requests.post(
        f"{SUPABASE_URL}/storage/v1/bucket",
        headers=headers,
        json={"id": STORAGE_BUCKET, "name": STORAGE_BUCKET, "public": True},
        timeout=15,
    )
    return create_resp.ok


def upload_audio(service_key: str, path_in_bucket: str, mp3_bytes: bytes) -> str | None:
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
    }
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path_in_bucket}"
    resp = requests.post(upload_url, headers=headers, data=mp3_bytes, timeout=120)
    if not resp.ok:
        print(f"    [warn] Storage upload failed ({resp.status_code}): {resp.text[:200]}")
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path_in_bucket}"


def patch_lesson_audio(service_key: str, lesson_id: int, audio_url: str) -> bool:
    headers = get_sb_headers(service_key)
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/cai_lessons",
        headers=headers,
        params={"id": f"eq.{lesson_id}"},
        json={"audio_url": audio_url},
        timeout=30,
    )
    return resp.ok


# ---------------------------------------------------------------------------
# Text preparation
# ---------------------------------------------------------------------------

def markdown_to_speech_text(markdown: str) -> str:
    """
    Convert markdown to plain text suitable for TTS.
    - Remove code blocks
    - Remove markdown syntax (##, **, *, [], etc.)
    - Collapse excess whitespace
    - Keep sentence structure intact for natural reading
    """
    text = markdown

    # Remove code blocks entirely (not readable aloud)
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"`[^`]+`", " ", text)

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # Convert headings to spoken transitions
    text = re.sub(r"^#{1,6}\s+(.+)$", r"\1.", text, flags=re.MULTILINE)

    # Remove bold/italic markers but keep text
    text = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,2}([^_]+)_{1,2}", r"\1", text)

    # Remove links but keep the label
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)

    # Remove image markdown
    text = re.sub(r"!\[.*?\]\(.*?\)", " ", text)

    # Convert bullet/numbered lists to prose with pauses
    text = re.sub(r"^\s*[-*+]\s+", "  ", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "  ", text, flags=re.MULTILINE)

    # Remove horizontal rules
    text = re.sub(r"^[-*_]{3,}$", " ", text, flags=re.MULTILINE)

    # Collapse multiple spaces and blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


def split_into_chunks(text: str, max_chars: int = ELEVENLABS_CHUNK_LIMIT) -> list[str]:
    """
    Split text into chunks of at most max_chars characters, breaking
    at sentence boundaries (. ! ?) wherever possible.
    """
    if len(text) <= max_chars:
        return [text]

    chunks = []
    # Split on sentence-ending punctuation followed by whitespace
    sentences = re.split(r"(?<=[.!?])\s+", text)

    current_chunk = ""
    for sentence in sentences:
        # If a single sentence is too long, hard-split it
        if len(sentence) > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""
            # Hard split the long sentence at word boundaries
            words = sentence.split()
            temp = ""
            for word in words:
                if len(temp) + len(word) + 1 > max_chars:
                    if temp:
                        chunks.append(temp.strip())
                    temp = word
                else:
                    temp = f"{temp} {word}".strip() if temp else word
            if temp:
                chunks.append(temp.strip())
            continue

        candidate = f"{current_chunk} {sentence}".strip() if current_chunk else sentence
        if len(candidate) > max_chars:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk = candidate

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return [c for c in chunks if c]


# ---------------------------------------------------------------------------
# ElevenLabs TTS
# ---------------------------------------------------------------------------

def synthesize_chunk(api_key: str, text: str) -> bytes | None:
    """Call ElevenLabs TTS for a single text chunk. Returns MP3 bytes."""
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = requests.post(
                ELEVENLABS_TTS_URL,
                headers=headers,
                json=payload,
                timeout=120,
            )
            if resp.status_code == 200:
                return resp.content
            elif resp.status_code == 429:
                wait = RETRY_BACKOFF * attempt
                print(f"    [warn] ElevenLabs rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue
            else:
                print(f"    [warn] ElevenLabs error {resp.status_code}: {resp.text[:200]}")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_BACKOFF * attempt)
                    continue
                return None
        except requests.exceptions.Timeout:
            print(f"    [warn] ElevenLabs timeout on attempt {attempt}/{RETRY_ATTEMPTS}")
            if attempt < RETRY_ATTEMPTS:
                time.sleep(RETRY_BACKOFF)
        except Exception as e:
            print(f"    [warn] ElevenLabs exception: {e}")
            if attempt < RETRY_ATTEMPTS:
                time.sleep(RETRY_BACKOFF)

    return None


def synthesize_text(api_key: str, text: str) -> bytes | None:
    """
    Synthesize full text, splitting into chunks if needed.
    Returns concatenated MP3 bytes.
    """
    chunks = split_into_chunks(text)
    if len(chunks) > 1:
        print(f"    Text split into {len(chunks)} chunks ({len(text)} chars total).")

    all_audio = b""
    for i, chunk in enumerate(chunks, 1):
        if len(chunks) > 1:
            print(f"    Synthesizing chunk {i}/{len(chunks)} ({len(chunk)} chars)...")
        audio = synthesize_chunk(api_key, chunk)
        if not audio:
            print(f"    [FAIL] TTS failed on chunk {i}.")
            return None
        all_audio += audio
        if i < len(chunks):
            time.sleep(1)  # Brief pause between chunk requests

    return all_audio


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(args):
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("ERROR: SUPABASE_SERVICE_KEY environment variable is not set.")
        sys.exit(1)

    elevenlabs_api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not elevenlabs_api_key and not args.dry_run:
        print("ERROR: ELEVENLABS_API_KEY environment variable is not set.")
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

    # Filter
    if args.retry_failed:
        lessons = [l for l in lessons if l["slug"] in state["failed"]]
        print(f"Retry mode: {len(lessons)} failed lesson(s).")
    else:
        if not args.lesson:
            # Skip lessons that already have audio or are already completed
            lessons = [
                l for l in lessons
                if l["slug"] not in state["completed"] and not l.get("audio_url")
            ]
            print(f"Pending (no audio yet): {len(lessons)} lesson(s).")

    if args.limit:
        lessons = lessons[: args.limit]
        print(f"Limited to {len(lessons)} by --limit.")

    if not lessons:
        print("Nothing to do.")
        print(f"  Completed: {len(state['completed'])}, Failed: {len(state['failed'])}")
        return

    if args.dry_run:
        print("\n--- DRY RUN ---")
        for lesson in lessons:
            md = lesson.get("content_markdown") or ""
            speech_text = markdown_to_speech_text(md)
            chunks = split_into_chunks(speech_text)
            print(
                f"  {lesson['slug']}: {len(md)} chars markdown → "
                f"{len(speech_text)} chars TTS → {len(chunks)} chunk(s)"
            )
        return

    # Ensure bucket exists
    print(f"Ensuring storage bucket '{STORAGE_BUCKET}' exists...")
    if not ensure_bucket(service_key):
        print(f"WARNING: Could not verify/create bucket '{STORAGE_BUCKET}'. Continuing.")

    total = len(lessons)
    success_count = 0
    fail_count = 0
    start_time = time.time()

    for idx, lesson in enumerate(lessons, 1):
        slug = lesson["slug"]
        title = lesson.get("title", slug)
        course_slug = lesson.get("_course", {}).get("slug", "general")

        elapsed = time.time() - start_time
        eta_str = ""
        if idx > 1:
            avg = elapsed / (idx - 1)
            remaining = avg * (total - idx + 1)
            eta_str = f" | ETA {remaining / 60:.1f}m"

        print(f"\n[{idx}/{total}] {slug}: {title}{eta_str}")

        content = lesson.get("content_markdown") or ""
        if not content:
            print("  [skip] No content_markdown to narrate.")
            state["failed"][slug] = {
                "error": "no content_markdown",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            continue

        speech_text = markdown_to_speech_text(content)
        if not speech_text.strip():
            print("  [skip] Content reduced to empty string after markdown cleanup.")
            state["failed"][slug] = {
                "error": "empty after markdown conversion",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            continue

        print(f"  Text: {len(speech_text)} chars ({len(split_into_chunks(speech_text))} chunk(s))")
        print(f"  Calling ElevenLabs TTS (voice: Rachel)...")

        mp3_bytes = synthesize_text(elevenlabs_api_key, speech_text)
        if not mp3_bytes:
            print(f"  [FAIL] TTS synthesis failed.")
            state["failed"][slug] = {
                "error": "elevenlabs synthesis failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                time.sleep(COOLDOWN_SECONDS)
            continue

        print(f"  Audio: {len(mp3_bytes) / 1024:.1f} KB. Uploading...")
        storage_path = f"{course_slug}/{slug}/narration.mp3"
        audio_url = upload_audio(service_key, storage_path, mp3_bytes)

        if not audio_url:
            print(f"  [FAIL] Storage upload failed.")
            state["failed"][slug] = {
                "error": "supabase storage upload failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                time.sleep(COOLDOWN_SECONDS)
            continue

        print(f"  Uploaded: {audio_url}")
        print(f"  Updating lesson row...")
        ok = patch_lesson_audio(service_key, lesson["id"], audio_url)
        if not ok:
            print(f"  [FAIL] Supabase PATCH failed.")
            state["failed"][slug] = {
                "error": "supabase patch failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
        else:
            print(f"  [OK] Narration generated and saved.")
            state["completed"][slug] = {
                "lesson_id": lesson["id"],
                "url": audio_url,
                "bytes": len(mp3_bytes),
                "speech_chars": len(speech_text),
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
    print("Narration Generation Pipeline — Done")
    print(f"  Success : {success_count}")
    print(f"  Failed  : {fail_count}")
    print(f"  Total   : {total}")
    print(f"  Time    : {total_elapsed / 60:.1f}m")
    print(f"  State   : {STATE_FILE}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="CAI Prep Course — Narration Generation Pipeline"
    )
    parser.add_argument("--retry-failed", action="store_true", help="Retry failed lessons")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N lessons")
    parser.add_argument("--lesson", type=str, default=None, help="Process single lesson by slug")
    parser.add_argument("--dry-run", action="store_true", help="Print plan, no API calls")
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()
