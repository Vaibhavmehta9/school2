"""Tests for FAQ loader, hot-reloading, schema validation, and Mode A/B source tracking."""

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
    assert len(data["entries"]) >= 40  # Must have comprehensive coverage


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


def test_mode_a_and_mode_b_labeling():
    """Verify that every entry is explicitly labeled as either official or demo."""
    entries = get_all_entries()
    official_count = 0
    demo_count = 0

    for entry in entries:
        source = entry.get("source")
        assert source in ("official", "demo"), f"Entry {entry['id']} has invalid source '{source}'"

        if source == "official":
            official_count += 1
            assert entry.get("demo") is False, f"Official entry {entry['id']} must have demo=False"
            assert entry.get("source_url"), f"Official entry {entry['id']} missing source_url"
            assert entry.get("fetched_on"), f"Official entry {entry['id']} missing fetched_on"
        else:
            demo_count += 1
            assert entry.get("demo") is True, f"Demo entry {entry['id']} must have demo=True"

    assert official_count >= 30, f"Expected at least 30 official entries, got {official_count}"
    assert demo_count >= 8, f"Expected at least 8 demo gap entries, got {demo_count}"


def test_zero_fill_markers_remaining():
    """Verify that all [FILL] placeholders have been completed with Mode B demo data."""
    fill_entries = get_fill_entries()
    assert len(fill_entries) == 0, f"Unresolved [FILL] entries found: {[e['id'] for e in fill_entries]}"


def test_fill_safety_guard_on_synthetic_entry():
    """Verify that get_safe_answer intercepts any future [FILL] placeholder."""
    mock_fill_entry = {
        "id": "mock_test",
        "category": "Test",
        "answer": "Fee amount is [FILL: pending approval]",
    }
    safe_reply = get_safe_answer(mock_fill_entry)
    assert "[FILL" not in safe_reply
    assert "confirming" in safe_reply or "Admissions Office" in safe_reply


def test_knowledge_block_formatting():
    """Verify that formatted knowledge block for AI prompt is non-empty and well-structured."""
    block = format_faq_knowledge_block()
    assert isinstance(block, str)
    assert len(block) > 1000
    assert "[FILL" not in block, "Raw [FILL] must never appear in the model knowledge block"


def test_demo_flag_status():
    """Verify top-level demo_data flag is enabled while demo entries exist."""
    demo = get_demo_flag()
    assert demo is True
