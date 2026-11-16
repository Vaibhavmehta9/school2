import asyncio
import json
import unittest.mock as mock
import pytest
from fastapi.testclient import TestClient
from app.main import app
import app.weather_service as ws

client = TestClient(app)

def test_stream_first_event_is_thinking():
    with client.stream("POST", "/api/ai/chat/stream", json={"message": "Hi", "history": []}) as resp:
        assert resp.status_code == 200
        first_line = next(line for line in resp.iter_lines() if line)
        assert "data:" in first_line
        payload = json.loads(first_line.replace("data:", "").strip())
        assert payload.get("status") == "thinking"

def test_stream_success_emits_done():
    with client.stream("POST", "/api/ai/chat/stream", json={"message": "Hi", "history": []}) as resp:
        assert resp.status_code == 200
        lines = [line for line in resp.iter_lines() if line]
        assert lines[-1].strip() == "data: [DONE]"

def test_stream_weather_failure_emits_done():
    with mock.patch("app.weather_service.fetch_weather_data", return_value=None):
        with client.stream("POST", "/api/ai/chat/stream", json={"message": "Weather at campus", "history": []}) as resp:
            assert resp.status_code == 200
            lines = [line for line in resp.iter_lines() if line]
            assert lines[-1].strip() == "data: [DONE]"
            full_text = "".join(
                json.loads(l.replace("data:", "").strip()).get("chunk", "")
                for l in lines
                if "chunk" in l
            )
            assert "I couldn't fetch live weather right now. You can ask me about admissions meanwhile." in full_text

def test_stream_exception_emits_done():
    with mock.patch("app.routers.ai.route_and_resolve_query", side_effect=RuntimeError("Simulated server failure")):
        with client.stream("POST", "/api/ai/chat/stream", json={"message": "Hello", "history": []}) as resp:
            assert resp.status_code == 200
            lines = [line for line in resp.iter_lines() if line]
            assert lines[-1].strip() == "data: [DONE]"
            error_line = next((l for l in lines if '"error"' in l), None)
            assert error_line is not None
            payload = json.loads(error_line.replace("data:", "").strip())
            # Ensure error message is friendly and never leaks exception details or keys
            assert "unexpected error" in payload["error"].lower()
            assert "Simulated server failure" not in payload["error"]

def test_stream_timeout_emits_done():
    # Simulate a TimeoutError inside the stream
    with mock.patch("asyncio.to_thread", side_effect=TimeoutError()):
        with client.stream("POST", "/api/ai/chat/stream", json={"message": "Hello", "history": []}) as resp:
            assert resp.status_code == 200
            lines = [line for line in resp.iter_lines() if line]
            assert lines[-1].strip() == "data: [DONE]"
            error_line = next((l for l in lines if '"error"' in l), None)
            assert error_line is not None
            assert "taking longer than expected" in error_line
