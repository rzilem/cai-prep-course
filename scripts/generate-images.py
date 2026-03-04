#!/usr/bin/env python3
"""
CAI Prep Course — Image Generation Pipeline
============================================
Reads all lessons from Supabase, generates 1 hero image per lesson using
Google Gemini Imagen 3, uploads to Supabase Storage bucket `cai-images`,
then writes the public URL back to the `images` column.

Usage:
    python3 scripts/generate-images.py               # Process all pending lessons
    python3 scripts/generate-images.py --retry-failed # Retry only failed lessons
    python3 scripts/generate-images.py --limit 10     # Process at most N lessons
    python3 scripts/generate-images.py --lesson <slug> # Process a single lesson
    python3 scripts/generate-images.py --dry-run       # Print prompts, no API calls

Environment:
    SUPABASE_SERVICE_KEY   (required)
    GEMINI_API_KEY         (required)
"""

import argparse
import base64
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
STORAGE_BUCKET = "cai-images"

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "imagen-3.0-generate-002:predict"
)

COOLDOWN_SECONDS = 8  # Imagen 3 has per-minute rate limits
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 15

STATE_FILE = Path(__file__).parent / "generate-images-progress.json"

BRAND_STYLE = (
    "Modern flat illustration for a professional educational course about "
    "community association management. Style: clean lines, professional color "
    "palette (navy blue, teal, white), no text overlays, no people, "
    "educational and clean. High quality, 16:9 aspect ratio."
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
    """Fetch all lessons with course context."""
    headers = get_headers(service_key)

    params = {
        "select": "id,slug,title,images,module_id,course_id",
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

    # Enrich with course slugs for storage path organization
    course_ids = list({l["course_id"] for l in lessons if l.get("course_id")})
    course_map = {}
    if course_ids:
        cr = requests.get(
            f"{SUPABASE_URL}/rest/v1/cai_courses",
            headers=headers,
            params={
                "select": "id,slug,title,credential_code",
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
    """Create the storage bucket if it does not exist."""
    headers = get_headers(service_key)
    # Check if bucket exists
    resp = requests.get(
        f"{SUPABASE_URL}/storage/v1/bucket/{STORAGE_BUCKET}",
        headers=headers,
        timeout=15,
    )
    if resp.status_code == 200:
        return True
    if resp.status_code == 400:
        # Create bucket (public so URLs are directly accessible)
        create_resp = requests.post(
            f"{SUPABASE_URL}/storage/v1/bucket",
            headers=headers,
            json={"id": STORAGE_BUCKET, "name": STORAGE_BUCKET, "public": True},
            timeout=15,
        )
        return create_resp.ok
    return False


def upload_image(service_key: str, path_in_bucket: str, image_bytes: bytes) -> str | None:
    """Upload PNG bytes to Supabase Storage. Returns the public URL or None."""
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path_in_bucket}"
    resp = requests.post(upload_url, headers=headers, data=image_bytes, timeout=60)
    if not resp.ok:
        print(f"    [warn] Storage upload failed ({resp.status_code}): {resp.text[:200]}")
        return None

    public_url = (
        f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path_in_bucket}"
    )
    return public_url


def patch_lesson_images(service_key: str, lesson_id: int, image_url: str) -> bool:
    """Append the image URL to the lesson's images array."""
    headers = get_headers(service_key)
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/cai_lessons",
        headers=headers,
        params={"id": f"eq.{lesson_id}"},
        json={"images": [image_url]},
        timeout=30,
    )
    return resp.ok


# ---------------------------------------------------------------------------
# Gemini Imagen helpers
# ---------------------------------------------------------------------------

def build_prompt(lesson: dict) -> str:
    title = lesson.get("title", "community association management")
    course = lesson.get("_course", {})
    course_title = course.get("title", "CAI Certification")
    credential = course.get("credential_code", "")
    context = f"{course_title}" + (f" ({credential})" if credential else "")
    return (
        f"Professional photo-realistic illustration for a CAI certification lesson about "
        f'"{title}". Context: {context} exam preparation course. {BRAND_STYLE}'
    )


def generate_image(gemini_api_key: str, prompt: str) -> bytes | None:
    """Call Gemini Imagen 3 and return PNG bytes."""
    url = f"{GEMINI_ENDPOINT}?key={gemini_api_key}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "16:9",
            "personGeneration": "DONT_ALLOW",
        },
    }

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = requests.post(url, json=payload, timeout=120)
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get("predictions", [])
                if predictions:
                    b64 = predictions[0].get("bytesBase64Encoded", "")
                    if b64:
                        return base64.b64decode(b64)
                print(f"    [warn] No image data in Gemini response: {str(data)[:200]}")
                return None
            elif resp.status_code == 429:
                wait = RETRY_BACKOFF * attempt
                print(f"    [warn] Rate limited (429). Waiting {wait}s...")
                time.sleep(wait)
                continue
            else:
                print(f"    [warn] Gemini error {resp.status_code}: {resp.text[:200]}")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_BACKOFF * attempt)
                    continue
                return None
        except requests.exceptions.Timeout:
            print(f"    [warn] Gemini timeout on attempt {attempt}/{RETRY_ATTEMPTS}")
            if attempt < RETRY_ATTEMPTS:
                time.sleep(RETRY_BACKOFF)
        except Exception as e:
            print(f"    [warn] Gemini exception on attempt {attempt}: {e}")
            if attempt < RETRY_ATTEMPTS:
                time.sleep(RETRY_BACKOFF)

    return None


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(args):
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("ERROR: SUPABASE_SERVICE_KEY environment variable is not set.")
        sys.exit(1)

    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key and not args.dry_run:
        print("ERROR: GEMINI_API_KEY environment variable is not set.")
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
            # Skip lessons that already have images
            lessons = [
                l for l in lessons
                if l["slug"] not in state["completed"]
            ]
            print(f"Pending (no image yet): {len(lessons)} lesson(s).")

    if args.limit:
        lessons = lessons[: args.limit]
        print(f"Limited to {len(lessons)} by --limit.")

    if not lessons:
        print("Nothing to do.")
        print(f"  Completed: {len(state['completed'])}, Failed: {len(state['failed'])}")
        return

    if args.dry_run:
        print("\n--- DRY RUN (no API calls) ---")
        for lesson in lessons:
            print(f"  {lesson['slug']}: {build_prompt(lesson)[:100]}...")
        return

    # Ensure storage bucket exists
    print(f"Ensuring storage bucket '{STORAGE_BUCKET}' exists...")
    if not ensure_bucket(service_key):
        print(f"WARNING: Could not verify/create bucket '{STORAGE_BUCKET}'. Continuing anyway.")

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

        prompt = build_prompt(lesson)
        print(f"  Prompt: {prompt[:100]}...")
        print(f"  Calling Gemini Imagen 3...")

        image_bytes = generate_image(gemini_api_key, prompt)
        if not image_bytes:
            print(f"  [FAIL] Could not generate image.")
            state["failed"][slug] = {
                "error": "gemini returned no image",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                print(f"  Cooling down {COOLDOWN_SECONDS}s...")
                time.sleep(COOLDOWN_SECONDS)
            continue

        print(f"  Generated {len(image_bytes) / 1024:.1f} KB. Uploading to Supabase Storage...")
        storage_path = f"{course_slug}/{slug}/hero.png"
        public_url = upload_image(service_key, storage_path, image_bytes)

        if not public_url:
            print(f"  [FAIL] Upload to Supabase Storage failed.")
            state["failed"][slug] = {
                "error": "supabase storage upload failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
            save_state(state)
            if idx < total:
                time.sleep(COOLDOWN_SECONDS)
            continue

        print(f"  Uploaded: {public_url}")
        print(f"  Updating lesson row...")
        ok = patch_lesson_images(service_key, lesson["id"], public_url)
        if not ok:
            print(f"  [FAIL] Supabase PATCH failed for lesson {lesson['id']}.")
            state["failed"][slug] = {
                "error": "supabase patch failed",
                "timestamp": datetime.utcnow().isoformat(),
            }
            fail_count += 1
        else:
            print(f"  [OK] Image generated and saved.")
            state["completed"][slug] = {
                "lesson_id": lesson["id"],
                "url": public_url,
                "bytes": len(image_bytes),
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
    print("Image Generation Pipeline — Done")
    print(f"  Success : {success_count}")
    print(f"  Failed  : {fail_count}")
    print(f"  Total   : {total}")
    print(f"  Time    : {total_elapsed / 60:.1f}m")
    print(f"  State   : {STATE_FILE}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="CAI Prep Course — Image Generation Pipeline"
    )
    parser.add_argument("--retry-failed", action="store_true", help="Retry failed lessons")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N lessons")
    parser.add_argument("--lesson", type=str, default=None, help="Process single lesson by slug")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts, no API calls")
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()
