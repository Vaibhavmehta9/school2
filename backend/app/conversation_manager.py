"""Conversation context manager for multi-turn resolution.

Features:
- Untrusted history sanitization (strictly 'user' and 'assistant' roles, lengths capped)
- History caps: max 6 turns, max 1000 characters per message
- Resolves contextual follow-ups:
  - "and for boarding?" -> "What are the fees for boarding?"
  - "how is it paid?" -> "How are school fees paid?"
  - "What about tomorrow?" -> Weather tomorrow for active city
  - "And in Jodhpur?" -> Weather in Jodhpur
  - "What's the weather there?" -> Resolves 'there' to active city or Nainital campus
"""

from __future__ import annotations

import re
from typing import Any

from .weather_service import CAMPUS_LOCATION

MAX_HISTORY_TURNS = 6
MAX_MSG_CHARS = 1000


def sanitize_history(history: list[dict[str, Any]] | list[Any] | None) -> list[dict[str, str]]:
    """Sanitize and cap conversation history turns."""
    if not history:
        return []

    clean: list[dict[str, str]] = []
    for turn in history[-MAX_HISTORY_TURNS:]:
        role = turn.get("role") if isinstance(turn, dict) else getattr(turn, "role", None)
        content = (turn.get("content") if isinstance(turn, dict) else getattr(turn, "content", "")) or ""
        text = str(content).strip()[:MAX_MSG_CHARS]
        if role in ("user", "assistant") and text:
            clean.append({"role": role, "content": text})

    return clean


def extract_city_from_text(text: str) -> str | None:
    """Extract city name from user message."""
    clean = text.lower()
    known_cities = [
        "nainital", "jodhpur", "delhi", "mumbai", "jaipur",
        "lucknow", "dehradun", "chandigarh", "bengaluru",
        "bangalore", "kolkata", "chennai", "pune", "ahmedabad",
    ]
    for city in known_cities:
        if re.search(rf"\b{city}\b", clean):
            return city.capitalize()

    # Regex fallback for "in <City>"
    match = re.search(r"\b(?:in|at|for)\s+([A-Z][a-zA-Z]+)", text)
    if match:
        candidate = match.group(1)
        if candidate.lower() not in {"the", "school", "campus", "sherwood", "college", "hostel", "class", "admission"}:
            return candidate.capitalize()

    return None


def resolve_active_city_from_history(history: list[dict[str, Any]]) -> str:
    """Find the most recently discussed city from history, defaulting to Nainital."""
    for turn in reversed(history):
        content = turn.get("content", "")
        city = extract_city_from_text(content)
        if city:
            return city
    return CAMPUS_LOCATION["city"]


def resolve_contextual_query(query: str, history: list[dict[str, Any]] | None = None) -> tuple[str, dict[str, Any]]:
    """Resolve pronouns and ellipitcal queries into a fully contextualized query.
    
    Returns (resolved_query, context_metadata).
    """
    clean = query.strip()
    meta: dict[str, Any] = {"is_followup": False, "resolved_city": CAMPUS_LOCATION["city"]}
    if not history:
        return clean, meta

    sanitized = sanitize_history(history)
    if not sanitized:
        return clean, meta

    last_user_turn = next((t["content"] for t in reversed(sanitized) if t["role"] == "user"), "")
    last_assistant_turn = next((t["content"] for t in reversed(sanitized) if t["role"] == "assistant"), "")
    prev_combined = f"{last_user_turn} {last_assistant_turn}".lower()

    lower_query = clean.lower()

    # 1. Weather follow-up resolution ("What about tomorrow?", "What's the weather there?", "And in Jodhpur?")
    is_weather_context = any(w in prev_combined for w in ("weather", "temperature", "temp", "mausam", "thand", "sardi", "barish", "rain", "forecast"))
    is_weather_inquiry = bool(re.search(r"\b(weather|temperature|temp|mausam|thand|sardi|barish|forecast)\b", lower_query))

    if is_weather_inquiry or (is_weather_context and (
        re.search(r"\b(tomorrow|there|kal|forecast)\b", lower_query)
        or lower_query.startswith("and in ")
        or lower_query.startswith("what about in ")
        or lower_query.startswith("in ")
    )):
        active_city = resolve_active_city_from_history(sanitized)
        explicit_city = extract_city_from_text(clean)
        resolved_city = explicit_city or active_city
        meta["resolved_city"] = resolved_city

        if re.search(r"\b(there|campus|school)\b", lower_query) and not explicit_city:
            clean = f"What is the weather in {resolved_city}?"
            meta["is_followup"] = True
        elif lower_query in ("what about tomorrow?", "and tomorrow?", "kal kaisa rahega?", "tomorrow?"):
            clean = f"What is the weather forecast for tomorrow in {resolved_city}?"
            meta["is_followup"] = True
        elif lower_query.startswith("and in ") or lower_query.startswith("what about in ") or (is_weather_context and lower_query.startswith("in ")):
            clean = f"What is the weather in {resolved_city}?"
            meta["is_followup"] = True

    # 2. School fee follow-up resolution ("and for boarding?", "how is it paid?", "for class 6?")
    elif "fee" in prev_combined or "cost" in prev_combined or "charges" in prev_combined:
        if lower_query.startswith("and for ") or lower_query.startswith("aur "):
            topic = re.sub(r"^(and\s+for|aur)\s+", "", clean, flags=re.IGNORECASE).rstrip(" ?")
            clean = f"What are the fees for {topic} at Sherwood College?"
            meta["is_followup"] = True
        elif "how is it paid" in lower_query or "payment mode" in lower_query or "kaise pay karein" in lower_query:
            clean = "What are the accepted payment modes for school fees?"
            meta["is_followup"] = True
        elif re.search(r"\bclass\s+\d+\b", lower_query):
            clean = f"What are the school fees for {clean} at Sherwood College?"
            meta["is_followup"] = True

    return clean, meta

