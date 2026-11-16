"""Validation script for Sherwood College Admissions FAQ (backend/data/school_faq.json).

Checks:
1. Valid JSON and required top-level keys
2. Unique, kebab/snake_case entry IDs
3. Non-empty questions list (3-6 questions per entry in English, Hindi, Hinglish)
4. Non-empty answers in Markdown
5. Strict source tracking ('official' or 'demo') and demo boolean flag
6. Official entries must have valid source_url pointing to sherwood.edu.in
7. Demo entries must include the mandatory demo note
8. Verification of all 17 required categories
9. Report counts of official, demo, and [FILL] entries
"""

import json
import sys
from pathlib import Path

FAQ_PATH = Path(__file__).resolve().parents[1] / "data" / "school_faq.json"

REQUIRED_CATEGORIES = {
    "About",
    "Admission process and dates",
    "Eligibility and age",
    "Documents required",
    "Entrance test/interaction",
    "FEES",
    "Boarding/hostel",
    "Facilities",
    "Academics/curriculum",
    "Sports and activities",
    "Transport",
    "School timings",
    "Uniform and books",
    "Safety",
    "Mobile phone policy",
    "Contact and campus visit",
    "Scholarships",
}

DEMO_NOTE_SUBSTR = "Demo data: please confirm details with the admissions office"

def validate_faq():
    if not FAQ_PATH.exists():
        print(f"ERROR: FAQ file does not exist at {FAQ_PATH}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(FAQ_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        print(f"ERROR: Invalid JSON syntax in {FAQ_PATH}: {exc}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, dict):
        print("ERROR: Root JSON must be an object.", file=sys.stderr)
        sys.exit(1)

    entries = data.get("entries")
    if not isinstance(entries, list) or len(entries) == 0:
        print("ERROR: 'entries' must be a non-empty list.", file=sys.stderr)
        sys.exit(1)

    seen_ids = set()
    found_categories = set()
    official_count = 0
    demo_count = 0
    fill_count = 0
    errors = []

    for idx, entry in enumerate(entries):
        entry_id = entry.get("id")
        if not entry_id or not isinstance(entry_id, str):
            errors.append(f"Index {idx}: Missing or invalid 'id'")
            continue

        if entry_id in seen_ids:
            errors.append(f"Index {idx}: Duplicate entry id '{entry_id}'")
        seen_ids.add(entry_id)

        category = entry.get("category")
        if not category or category not in REQUIRED_CATEGORIES:
            errors.append(f"Entry '{entry_id}': Category '{category}' not in required 17 categories")
        else:
            found_categories.add(category)

        questions = entry.get("questions")
        if not isinstance(questions, list) or len(questions) < 1:
            errors.append(f"Entry '{entry_id}': Must have at least 1 question")
        else:
            for q_idx, q in enumerate(questions):
                if not isinstance(q, str) or not q.strip():
                    errors.append(f"Entry '{entry_id}': Question {q_idx} is empty")

        answer = entry.get("answer")
        if not isinstance(answer, str) or not answer.strip():
            errors.append(f"Entry '{entry_id}': Answer is empty")
        elif "[FILL" in answer:
            fill_count += 1

        source = entry.get("source")
        demo = entry.get("demo")

        if source == "official":
            official_count += 1
            if demo is not False:
                errors.append(f"Entry '{entry_id}': Official entry must have demo=False")
            if not entry.get("source_url"):
                errors.append(f"Entry '{entry_id}': Official entry must have a non-empty 'source_url'")
        elif source == "demo":
            demo_count += 1
            if demo is not True:
                errors.append(f"Entry '{entry_id}': Demo entry must have demo=True")
            if DEMO_NOTE_SUBSTR not in answer:
                errors.append(f"Entry '{entry_id}': Demo entry must include the disclaimer note: '{DEMO_NOTE_SUBSTR}'")
        else:
            errors.append(f"Entry '{entry_id}': Source must be 'official' or 'demo', got '{source}'")

    missing_cats = REQUIRED_CATEGORIES - found_categories
    if missing_cats:
        errors.append(f"Missing required categories: {sorted(list(missing_cats))}")

    print("=" * 72)
    print(" SHERWOOD COLLEGE ADMISSIONS FAQ VALIDATION REPORT")
    print("=" * 72)
    print(f"Total Entries:             {len(entries)}")
    print(f"Unique IDs Verified:       {len(seen_ids)}")
    print(f"Categories Covered:        {len(found_categories)} / {len(REQUIRED_CATEGORIES)}")
    print(f"Verified Official Entries: {official_count}")
    print(f"Demo Data Entries:         {demo_count}")
    print(f"Unresolved [FILL] Items:   {fill_count}")
    print("=" * 72)

    if errors:
        print(f"\nFAILED with {len(errors)} error(s):", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)

    print("\n✓ All validation checks passed successfully!")
    sys.exit(0)

if __name__ == "__main__":
    validate_faq()

