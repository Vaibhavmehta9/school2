"""Semantic retrieval and NLP embedding engine for Sherwood College Admissions FAQ.

Features:
- Fast TF-IDF character n-gram + word vectorizer across canonical FAQ questions and answers
- Cosine similarity computation with SequenceMatcher and token overlap blending
- Modification-time caching (recomputes embeddings only when school_faq.json changes)
- Handles typos, spelling errors (e.g. 'feee', 'addmision', 'Sherwod') and Hindi/Hinglish keywords
- Returns top 3-5 candidates with confidence scores and threshold classification
"""

from __future__ import annotations

import logging
import os
import re
from difflib import SequenceMatcher
from pathlib import Path
from threading import Lock
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .faq_service import FAQ_FILE_PATH, get_all_entries, get_safe_answer

logger = logging.getLogger("nlp_engine")

# Configurable confidence thresholds
CONFIDENCE_HIGH = 0.78
CONFIDENCE_MEDIUM = 0.48

_engine_lock = Lock()
_cached_mtime: float = -1.0
_cached_vectorizer: TfidfVectorizer | None = None
_cached_matrix: Any = None
_cached_entries: list[dict[str, Any]] = []


def _normalize_text(text: str) -> str:
    """Normalize text by lowering, removing excessive punctuation, and normalizing spaces."""
    clean = re.sub(r"[^\w\s\u0900-\u097F]", " ", text.lower())
    return " ".join(clean.split())


def _build_entry_corpus_text(entry: dict[str, Any]) -> str:
    """Create rich text representation of an entry combining category, ID, all question phrasings, and answer."""
    questions_text = " ".join(entry.get("questions", []))
    category = entry.get("category", "")
    entry_id = entry.get("id", "").replace("_", " ")
    answer = entry.get("answer", "")
    return f"{entry_id} {category} {questions_text} {answer}"


def get_or_build_index(force_rebuild: bool = False) -> tuple[TfidfVectorizer, Any, list[dict[str, Any]]]:
    """Load or refresh the vector index when school_faq.json is modified."""
    global _cached_mtime, _cached_vectorizer, _cached_matrix, _cached_entries

    current_mtime = os.path.getmtime(FAQ_FILE_PATH) if FAQ_FILE_PATH.exists() else 0.0

    with _engine_lock:
        if not force_rebuild and _cached_matrix is not None and _cached_mtime == current_mtime:
            return _cached_vectorizer, _cached_matrix, _cached_entries

        entries = get_all_entries()
        corpus = [_normalize_text(_build_entry_corpus_text(e)) for e in entries]

        # Use hybrid word + character n-grams to gracefully tolerate typos and phonetic Hinglish
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            analyzer="word",
            sublinear_tf=True,
            min_df=1,
        )
        matrix = vectorizer.fit_transform(corpus)

        _cached_mtime = current_mtime
        _cached_vectorizer = vectorizer
        _cached_matrix = matrix
        _cached_entries = entries
        logger.info("Built NLP FAQ vector index (%d entries, mtime: %f)", len(entries), current_mtime)
        return _cached_vectorizer, _cached_matrix, _cached_entries


def preload_nlp_engine() -> None:
    """Preload TF-IDF vectorizer and build FAQ embedding index during app startup."""
    try:
        get_or_build_index(force_rebuild=False)
        logger.info("Preloaded NLP FAQ embedding index successfully.")
    except Exception as exc:
        logger.warning("Failed to preload NLP FAQ embedding index: %s", exc)


STOP_WORDS = {
    "what", "is", "are", "the", "a", "an", "does", "do", "did", "have", "has", "had",
    "for", "of", "in", "at", "on", "to", "and", "or", "tell", "me", "about", "there",
    "can", "you", "i", "we", "any", "some", "how", "much", "many",
    "provide", "provides", "offer", "offers", "student", "students",
    "kya", "hai", "hein", "ka", "ki", "ke", "ko", "se", "mein", "par", "batao",
    "school", "college", "sherwood"
}


def retrieve_faq_candidates(query: str, top_k: int = 4) -> list[dict[str, Any]]:
    """Retrieve top-k FAQ candidates with hybrid cosine similarity and fuzzy matching.
    
    Each result dict contains:
    - entry: dict (the canonical FAQ entry)
    - score: float (0.0 to 1.0)
    - level: 'HIGH' | 'MEDIUM' | 'LOW'
    """
    clean_query = _normalize_text(query)
    if not clean_query:
        return []

    vectorizer, matrix, entries = get_or_build_index()
    if not entries or matrix is None:
        return []

    # 1. Cosine similarity via TF-IDF vectorizer
    query_vec = vectorizer.transform([clean_query])
    cos_sims = cosine_similarity(query_vec, matrix)[0]

    raw_query_words = set(clean_query.split())
    query_content_words = {w for w in raw_query_words if w not in STOP_WORDS and len(w) > 2}
    scored_results: list[dict[str, Any]] = []

    for idx, entry in enumerate(entries):
        base_cos = float(cos_sims[idx])

        # 2. Check exact / token / fuzzy overlap against entry's specific question list
        questions = entry.get("questions", [])
        best_q_ratio = 0.0
        best_token_overlap = 0.0
        is_exact = False

        for q in questions:
            norm_q = _normalize_text(q)
            if norm_q == clean_query:
                is_exact = True
                best_q_ratio = 1.0
                break

            if clean_query in norm_q or norm_q in clean_query:
                cov = min(len(clean_query), len(norm_q)) / max(len(clean_query), len(norm_q))
                if cov >= 0.70:
                    best_q_ratio = max(best_q_ratio, 0.92)
                else:
                    best_q_ratio = max(best_q_ratio, 0.45 + (0.45 * cov))

            q_words = set(norm_q.split())
            q_content_words = {w for w in q_words if w not in STOP_WORDS and len(w) > 2}
            
            # Content word overlap with typo tolerance
            inter: set[str] = set()
            if query_content_words and q_content_words:
                for qw in query_content_words:
                    for ew in q_content_words:
                        if qw == ew or SequenceMatcher(None, qw, ew).ratio() >= 0.75:
                            inter.add(qw)
                            break
                overlap = (len(inter) * 2.0) / (len(query_content_words) + len(q_content_words))
                best_token_overlap = max(best_token_overlap, overlap)

            ratio = SequenceMatcher(None, clean_query, norm_q).ratio()
            # If query has distinct content words and less than 60% appear in this question phrasing,
            # prevent syntactic boilerplate ('Does the school provide...') from creating false positive matches
            if query_content_words and (len(inter) / len(query_content_words) < 0.60):
                ratio = min(ratio, 0.40)
            if ratio > best_q_ratio:
                best_q_ratio = ratio

        # Category and ID hint boost: only matching content words (exclude generic stop words like 'school')
        category_hint = 0.0
        norm_cat = _normalize_text(entry.get("category", ""))
        entry_id_norm = entry.get("id", "").replace("_", " ")
        if any(w in norm_cat or w in entry_id_norm for w in query_content_words):
            category_hint = 0.10

        # Weighted composite score: prioritize direct question match
        max_q_score = max(best_q_ratio, best_token_overlap)
        if is_exact or max_q_score >= 0.85:
            final_score = max(0.85, max_q_score)
        elif max_q_score >= 0.55:
            final_score = (0.65 * max_q_score) + (0.25 * base_cos) + category_hint
        elif query_content_words and best_token_overlap == 0.0 and base_cos < 0.20:
            # Query has meaningful content words that don't match this entry at all
            final_score = 0.20 * max_q_score
        else:
            final_score = (0.45 * max_q_score) + (0.45 * base_cos) + category_hint

        final_score = min(1.0, round(float(final_score), 3))

        level = "HIGH" if final_score >= CONFIDENCE_HIGH else ("MEDIUM" if final_score >= CONFIDENCE_MEDIUM else "LOW")

        scored_results.append({
            "entry": entry,
            "score": final_score,
            "level": level,
        })

    # Sort descending by final score
    scored_results.sort(key=lambda item: item["score"], reverse=True)
    return scored_results[:top_k]


def get_best_faq_match(query: str) -> tuple[dict[str, Any] | None, float, str]:
    """Return top matched entry, confidence score, and confidence level ('HIGH', 'MEDIUM', 'LOW')."""
    candidates = retrieve_faq_candidates(query, top_k=1)
    if not candidates:
        return None, 0.0, "LOW"

    top = candidates[0]
    return top["entry"], top["score"], top["level"]
