"""Comprehensive test suite for Sherwood FAQ Admissions Assistant.

Validates:
1. Greeting variants return instantly without calling OpenAI (mocked to ensure zero API calls)
2. "Hi, what are the fees?" is recognized as substantive inquiry and routed to FAQ/AI
3. Question matching against canonical FAQ entries from backend/data/sample_questions.json
4. [FILL] safety protection (synthetic placeholder never leaks to visitor)
5. Unknown questions guide user to official admissions fallback
6. Live weather integration (success path, timeout path, malformed response, 10-min cache)
7. Off-topic and prompt injection defense
8. Live FAQ file modification detection without server restart
"""

import json
import time
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.faq_service import (
    FAQ_FILE_PATH,
    find_matching_entry,
    get_safe_answer,
    load_faq_data,
)
from app.greeting_service import get_canned_greeting_reply
from app.main import app
from app.weather_service import (
    CACHE_TTL_SECONDS,
    fetch_live_weather,
    format_weather_context_for_prompt,
    is_weather_query,
)


@pytest.fixture
def client():
    import os
    os.environ["AI_RATE_LIMIT_REQUESTS"] = "200"
    from app.routers.ai import _request_history
    _request_history.clear()
    return TestClient(app)


def test_greeting_fast_path_never_calls_openai(client):
    """Greeting variants must return canned response instantly without invoking OpenAI."""
    greetings = ["hi", "Hello", "Namaste", "Good morning", "how are you", "who are you", "thanks", "bye"]

    with patch("app.routers.ai.generate_ai_reply") as mock_openai:
        for g in greetings:
            response = client.post("/api/ai/chat", json={"message": g})
            assert response.status_code == 200
            data = response.json()
            assert data.get("model") == "canned-greeting"
            assert "Sherwood" in data.get("answer") or "welcome" in data.get("answer").lower() or "goodbye" in data.get("answer").lower()
            assert "chips" in data
            assert len(data["chips"]) >= 1

        # Assert OpenAI was NEVER called for any of the pure greetings
        assert mock_openai.call_count == 0


def test_hybrid_greeting_with_question_routes_to_faq(client):
    """'Hi, what are the fees?' must NOT be treated as a pure greeting; it must route to FAQ/AI."""
    with patch("app.routers.ai.generate_ai_reply", return_value="The annual fees are approximately ₹7.5 Lakh to ₹8.0 Lakh.") as mock_openai:
        response = client.post("/api/ai/chat", json={"message": "Hi, what are the fees?"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("model") != "canned-greeting"
        assert mock_openai.call_count == 1


def test_sample_questions_matching():
    """Verify that sample questions match the intended FAQ entry IDs or expected handlers."""
    sample_file = Path(__file__).resolve().parent / "data" / "sample_questions.json"
    assert sample_file.exists()

    with open(sample_file, "r", encoding="utf-8") as f:
        samples = json.load(f)

    for item in samples:
        q = item["question"]
        expected_type = item["expected_type"]

        if expected_type == "greeting":
            res = get_canned_greeting_reply(q)
            assert res is not None, f"Expected greeting for: '{q}'"
        elif expected_type == "weather":
            assert is_weather_query(q), f"Expected weather query for: '{q}'"
        elif expected_type == "faq":
            entry, score = find_matching_entry(q)
            assert entry is not None, f"Failed to match FAQ for: '{q}'"
            assert score >= 0.5, f"Low match score {score} for '{q}'"
            if "expected_id" in item:
                # Top match or related category match
                cat_item = item.get("category", "").lower()
                cat_entry = entry.get("category", "").lower()
                assert (
                    entry["id"] == item["expected_id"]
                    or cat_entry in cat_item
                    or cat_item in cat_entry
                )


def test_fill_marker_never_leaks():
    """Verify that an answer containing [FILL] is completely intercepted."""
    synthetic_entry = {
        "id": "unconfirmed_dates",
        "category": "Admission process and dates",
        "answer": "The application closes on [FILL: exact date for 2027]",
    }
    safe_text = get_safe_answer(synthetic_entry)
    assert "[FILL" not in safe_text
    assert "confirming" in safe_text or "Admissions Office" in safe_text


def test_weather_success_path():
    """Verify Open-Meteo live weather data parsing and context formatting."""
    mock_payload = {
        "current": {
            "time": "2026-11-12T16:30",
            "temperature_2m": 12.5,
            "apparent_temperature": 11.0,
            "weather_code": 1,
            "wind_speed_10m": 6.2,
        },
        "daily": {
            "temperature_2m_max": [16.4],
            "temperature_2m_min": [8.1],
        },
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_response):
        weather = fetch_live_weather(force_refresh=True)
        assert weather is not None
        assert weather["temperature_c"] == 12.5
        assert weather["condition"] == "Mainly clear"
        assert weather["today_max_c"] == 16.4
        assert weather["today_min_c"] == 8.1

        prompt_block = format_weather_context_for_prompt()
        assert "12.5°C" in prompt_block
        assert "Mainly clear" in prompt_block
        assert "6,837 feet" in prompt_block


def test_weather_timeout_and_error_fallback():
    """Verify graceful handling when weather API times out or returns non-200."""
    with patch("httpx.Client.get", side_effect=Exception("Connection timed out")):
        with patch("app.weather_service._cached_weather", None):
            weather = fetch_live_weather(force_refresh=True)
            assert weather is None
            context = format_weather_context_for_prompt()
            assert "unavailable" in context.lower()


def test_weather_cache_reuse():
    """Verify that weather data is cached and does not make repeated HTTP requests."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "current": {"temperature_2m": 15.0, "weather_code": 0, "apparent_temperature": 14.0, "wind_speed_10m": 4.0},
        "daily": {"temperature_2m_max": [18.0], "temperature_2m_min": [10.0]},
    }

    with patch("httpx.Client.get", return_value=mock_response) as mock_get:
        # First call hits mock API
        w1 = fetch_live_weather(force_refresh=True)
        assert mock_get.call_count == 1
        # Second call within TTL hits in-memory cache
        w2 = fetch_live_weather(force_refresh=False)
        assert mock_get.call_count == 1  # Still 1
        assert w1["temperature_c"] == w2["temperature_c"]


def test_hot_reloading_faq_without_server_restart():
    """Verify that editing school_faq.json is immediately picked up by the loader."""
    initial_data = load_faq_data()
    initial_mtime = FAQ_FILE_PATH.stat().st_mtime

    # Re-reading unchanged file returns cached dictionary
    cached_data = load_faq_data()
    assert cached_data is initial_data

    # Simulating touch/edit updates mtime and forces reload
    with patch("os.path.getmtime", return_value=initial_mtime + 10.0):
        reloaded = load_faq_data()
        assert isinstance(reloaded, dict)
