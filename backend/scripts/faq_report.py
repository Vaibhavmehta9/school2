"""Audit and reporting tool for Sherwood College Admissions FAQ.

Prints:
- Total FAQ entries
- Count of verified official entries (source: "official")
- Count of demo data entries (source: "demo")
- Count of unresolved [FILL] items
- Complete inventory list of demo entry IDs to replace before production launch
"""

import json
from pathlib import Path

FAQ_FILE_PATH = Path(__file__).resolve().parents[1] / "data" / "school_faq.json"


def generate_faq_report() -> None:
    if not FAQ_FILE_PATH.exists():
        print(f"Error: FAQ file not found at {FAQ_FILE_PATH}")
        return

    with open(FAQ_FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("entries", [])
    total_count = len(entries)
    official_entries = [e for e in entries if e.get("source") == "official"]
    demo_entries = [e for e in entries if e.get("demo") is True or e.get("source") == "demo"]
    fill_entries = [e for e in entries if "[FILL" in e.get("answer", "")]

    print("=" * 72)
    print(" SHERWOOD COLLEGE ADMISSIONS FAQ AUDIT REPORT")
    print("=" * 72)
    print(f"Total FAQ Entries:          {total_count}")
    print(f"Verified Official Entries:  {len(official_entries)} ({len(official_entries)/total_count*100:.1f}%)")
    print(f"Demo Data Entries:          {len(demo_entries)} ({len(demo_entries)/total_count*100:.1f}%)")
    print(f"Unresolved [FILL] Items:    {len(fill_entries)}")
    print(f"Global demo_data Flag:      {data.get('demo_data', False)}")
    print("=" * 72)

    if demo_entries:
        print("\nDEMO DATA ENTRIES REQUIRING BURSAR / ADMIN DATA BEFORE PRODUCTION:")
        print("-" * 72)
        for idx, entry in enumerate(demo_entries, start=1):
            entry_id = entry.get("id", "unknown")
            category = entry.get("category", "General")
            print(f"{idx:2d}. [{category}] ID: '{entry_id}'")
        print("-" * 72)
    else:
        print("\nAll entries are verified official! No demo entries remain.")

    if fill_entries:
        print("\nWARNING: Unresolved [FILL] placeholders detected:")
        for idx, entry in enumerate(fill_entries, start=1):
            print(f"  {idx}. ID: '{entry.get('id')}'")
    else:
        print("\n✓ Zero [FILL] placeholders remaining.")
    print("=" * 72)


if __name__ == "__main__":
    generate_faq_report()
