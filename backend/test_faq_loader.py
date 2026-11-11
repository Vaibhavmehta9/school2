"""Tests for FAQ loader, hot-reloading, schema validation, and [FILL] safety."""

import json
from pathlib import Path

from app.faq_service import (
    FAQ_FILE_PATH,
    format_faq_knowledge_block,
    get_all_entries,
    get_demo_flag,
    get_fill_entries,
    get_safe_answer,
    load_faq_data,
    validate_faq_structure,
)


def test_faq_file_exists_and_loads():
    """Verify that backend/data/school_faq.json exists and loads successfully."""
    assert FAQ_FILE_PATH.exists()
    data = load_faq_data(force_reload=True)
    assert isinstance(data, dict)
    assert "entries" in data
    assert len(data["entries"]) >= 16  # Must cover all 16 categories


def test_faq_schema_integrity():
    """Verify unique IDs, non-empty fields, and valid categories."""
    data = load_faq_data()
    entries = data["entries"]
    seen_ids = set()

    for entry in entries:
        assert entry["id"], "Entry must have an ID"
        assert entry["id"] not in seen_ids, f"Duplicate ID: {entry['id']}"
        seen_ids.add(entry["id"])

        assert entry["category"], f"Entry {entry['id']} missing category"
        assert len(entry["questions"]) >= 1, f"Entry {entry['id']} has no questions"
        for q in entry["questions"]:
            assert q.strip(), f"Empty question in {entry['id']}"

        assert entry["answer"].strip(), f"Empty answer in {entry['id']}"


def test_fill_markers_never_leaked_in_safe_answers():
    """Verify that get_safe_answer never exposes [FILL text."""
    fill_entries = get_fill_entries()
    assert len(fill_entries) > 0, "Expected some [FILL entries for unconfirmed facts"

    for entry in fill_entries:
        safe_reply = get_safe_answer(entry)
        assert "[FILL" not in safe_reply
        assert "Admissions Office" in safe_reply or "confirming" in safe_reply


def test_knowledge_block_formatting():
    """Verify that formatted knowledge block for AI prompt contains no raw [FILL strings."""
    block = format_faq_knowledge_block()
    assert isinstance(block, str)
    assert len(block) > 500
    assert "[FILL" not in block, "Raw [FILL] must never appear in the model knowledge block"


def test_demo_flag_status():
    """Verify top-level demo_data flag is accessible."""
    demo = get_demo_flag()
    assert isinstance(demo, bool)
