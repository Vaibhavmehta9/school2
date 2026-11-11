"""Single source of truth FAQ loader, validator, and hot-reloading service.

Loads from backend/data/school_faq.json with modification-time caching,
ensuring live edits during demos take effect immediately without server restarts.
"""

from __future__ import annotations

import json
import logging
import os
import re
from difflib import SequenceMatcher
from pathlib import Path
from threading import Lock
from typing import Any

logger = logging.getLogger("school_faq")

FAQ_FILE_PATH = Path(__file__).resolve().parents[1] / "data" / "school_faq.json"

OFFICIAL_UNVERIFIED_FILL_FALLBACK = (
    "We are currently confirming the latest official schedule and specific figures for this item. "
    "Please contact the Sherwood College Admissions Office directly or submit an inquiry via the portal "
    "at /admission-details for verified guidance."
)

_cached_mtime: float = -1.0
_cached_data: dict[str, Any] = {}
_cache_lock = Lock()


class FAQValidationError(Exception):
    """Raised when the FAQ JSON file is malformed or violates integrity constraints."""


def validate_faq_structure(data: dict[str, Any]) -> dict[str, Any]:
    """Validate that the FAQ JSON has the required top-level fields and entry constraints."""
    if not isinstance(data, dict):
        raise FAQValidationError("FAQ file root must be a JSON object.")

    if "entries" not in data or not isinstance(data["entries"], list):
        raise FAQValidationError("FAQ must contain an 'entries' list.")

    entries = data["entries"]
    if not entries:
        raise FAQValidationError("FAQ 'entries' list cannot be empty.")

    seen_ids: set[str] = set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise FAQValidationError(f"Entry at index {index} must be an object.")

        entry_id = entry.get("id")
        if not entry_id or not isinstance(entry_id, str):
            raise FAQValidationError(f"Entry at index {index} is missing a valid 'id' string.")

        if entry_id in seen_ids:
            raise FAQValidationError(f"Duplicate entry id '{entry_id}' detected at index {index}.")
        seen_ids.add(entry_id)

        category = entry.get("category")
        if not category or not isinstance(category, str):
            raise FAQValidationError(f"Entry '{entry_id}' is missing a valid 'category'.")

        questions = entry.get("questions")
        if not isinstance(questions, list) or len(questions) < 1:
            raise FAQValidationError(f"Entry '{entry_id}' must contain a non-empty list of questions.")

        for q_idx, q in enumerate(questions):
            if not isinstance(q, str) or not q.strip():
                raise FAQValidationError(f"Entry '{entry_id}' question at index {q_idx} must be a non-empty string.")

        answer = entry.get("answer")
        if not isinstance(answer, str) or not answer.strip():
            raise FAQValidationError(f"Entry '{entry_id}' must contain a non-empty 'answer' string.")

    return data


def load_faq_data(force_reload: bool = False) -> dict[str, Any]:
    """Load FAQ data with cheap mtime-based hot-reloading cache."""
    global _cached_mtime, _cached_data

    if not FAQ_FILE_PATH.exists():
        raise FileNotFoundError(f"School FAQ file not found at: {FAQ_FILE_PATH}")

    current_mtime = os.path.getmtime(FAQ_FILE_PATH)

    with _cache_lock:
        if not force_reload and _cached_mtime == current_mtime and _cached_data:
            return _cached_data

        try:
            with open(FAQ_FILE_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            validated = validate_faq_structure(raw_data)
            _cached_data = validated
            _cached_mtime = current_mtime
            logger.info("Loaded school FAQ (%d entries, mtime: %f)", len(validated["entries"]), current_mtime)
            return _cached_data
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse school_faq.json: %s", exc)
            if _cached_data:
                logger.warning("Falling back to previous cached FAQ data.")
                return _cached_data
            raise FAQValidationError(f"Invalid JSON in school_faq.json: {exc}") from exc


def get_demo_flag() -> bool:
    """Return whether the demo_data flag is enabled."""
    data = load_faq_data()
    return bool(data.get("demo_data", False))


def get_all_entries() -> list[dict[str, Any]]:
    """Return list of all FAQ entries."""
    data = load_faq_data()
    return data.get("entries", [])


def is_fill_answer(answer: str) -> bool:
    """Check if an answer contains an unconfirmed [FILL] placeholder."""
    return "[FILL" in answer


def get_fill_entries() -> list[dict[str, Any]]:
    """Return all entries that currently require human completion ([FILL] items)."""
    return [e for e in get_all_entries() if is_fill_answer(e.get("answer", ""))]


def get_safe_answer(entry: dict[str, Any]) -> str:
    """Return the answer, or the official fallback if it contains [FILL]. Never leak FILL text."""
    raw_answer = entry.get("answer", "")
    if is_fill_answer(raw_answer):
        return OFFICIAL_UNVERIFIED_FILL_FALLBACK
    return raw_answer


def format_faq_knowledge_block() -> str:
    """Format all verified FAQ entries into a compact, structured Markdown block for the AI system prompt.
    
    Excludes or sanitizes entries containing [FILL] so unverified placeholders are never fed to the model.
    """
    entries = get_all_entries()
    blocks: list[str] = []

    for entry in entries:
        category = entry.get("category", "General")
        entry_id = entry.get("id", "")
        raw_answer = entry.get("answer", "")

        if is_fill_answer(raw_answer):
            # Tell the assistant this fact is being finalized so it provides the official admissions fallback
            safe_content = "This specific figure or schedule is pending official confirmation from the admissions office."
        else:
            safe_content = raw_answer

        blocks.append(f"### [{category}] ({entry_id})\n{safe_content}")

    return "\n\n".join(blocks)


def _tokenize(text: str) -> set[str]:
    """Tokenize query into lowercase words ignoring punctuation."""
    return set(re.findall(r"\b\w{2,}\b", text.lower()))


def find_matching_entry(query: str) -> tuple[dict[str, Any] | None, float]:
    """Find the most relevant FAQ entry using token overlap and SequenceMatcher fuzzy similarity.
    
    Returns (entry, confidence_score) where confidence_score is between 0.0 and 1.0.
    """
    clean_query = query.strip().lower()
    if not clean_query:
        return None, 0.0

    query_tokens = _tokenize(clean_query)
    entries = get_all_entries()

    best_entry: dict[str, Any] | None = None
    best_score: float = 0.0

    for entry in entries:
        questions = entry.get("questions", [])
        entry_id = entry.get("id", "").lower()
        category = entry.get("category", "").lower()

        for q in questions:
            clean_q = q.lower()
            q_tokens = _tokenize(clean_q)

            # 1. Exact equality
            if clean_query == clean_q:
                return entry, 1.0

            # 2. Substring match
            if clean_query in clean_q or clean_q in clean_query:
                score = 0.92
                if score > best_score:
                    best_score = score
                    best_entry = entry
                continue

            # 3. Token overlap (Jaccard-like)
            if query_tokens and q_tokens:
                intersection = query_tokens.intersection(q_tokens)
                if intersection:
                    token_score = (len(intersection) * 2.0) / (len(query_tokens) + len(q_tokens))
                    if token_score > best_score:
                        best_score = token_score
                        best_entry = entry

            # 4. Fuzzy SequenceMatcher similarity
            ratio = SequenceMatcher(None, clean_query, clean_q).ratio()
            if ratio > 0.75 and ratio > best_score:
                best_score = ratio
                best_entry = entry

    return best_entry, round(best_score, 2)

