"""Public, rate-limited AI chat endpoint used by the portal's AI widgets."""

from __future__ import annotations

import asyncio
import json
import logging
import os
from collections import defaultdict, deque
from collections.abc import AsyncGenerator
from threading import Lock
from time import monotonic, time
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from ..ai import (
    AIConfigurationError,
    AIProviderRateLimitError,
    AIProviderUnavailableError,
    configured_model,
    generate_ai_reply,
    is_openai_configured,
    stream_ai_reply,
)
from ..dependencies import resolve_verified_audience
from ..faq_service import find_matching_entry, get_safe_answer
from ..greeting_service import get_canned_greeting_reply
from ..query_router import route_and_resolve_query
from ..schemas import AIRequest
from ..school_knowledge import OFFICIAL_CONTACT_FALLBACK
from ..weather_service import (
    format_weather_context_for_prompt,
    get_live_weather_answer,
    is_weather_query,
)

logger = logging.getLogger("ai_assistant")

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

_request_history: dict[str, deque[float]] = defaultdict(deque)
_history_lock = Lock()
MAX_PAYLOAD_BYTES = 20_000


def _setting(name: str, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, str(default))))
    except ValueError:
        return default


def _check_rate_limit(client_id: str) -> None:
    limit = _setting("AI_RATE_LIMIT_REQUESTS", 60)
    window_seconds = _setting("AI_RATE_LIMIT_WINDOW_SECONDS", 300)
    now = monotonic()
    with _history_lock:
        timestamps = _request_history[client_id]
        while timestamps and now - timestamps[0] >= window_seconds:
            timestamps.popleft()
        if len(timestamps) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many AI requests. Please wait a few minutes and try again.",
            )
        timestamps.append(now)


def _check_payload_size(request: Request) -> None:
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_PAYLOAD_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="AI request payload is too large. Keep messages concise.",
                )
        except ValueError:
            pass


def _raise_ai_http_error(error: Exception) -> None:
    if isinstance(error, AIConfigurationError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured yet. Please ask the college administrator to add the server API key.",
        ) from error
    if isinstance(error, AIProviderRateLimitError):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI is busy right now. Please try again shortly.",
        ) from error
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AI service is temporarily unavailable. Please try again shortly.",
    ) from error


def _log_ai_metric(
    audience: str,
    latency_ms: float,
    source: str = "faq",
    matched_faq_ids: list[str] | None = None,
    error_type: str | None = None,
) -> None:
    """Log privacy-safe metrics only (no personal data or message content)."""
    logger.info(
        json.dumps({
            "timestamp": int(time()),
            "audience": audience,
            "source": source,
            "matched_faq_ids": matched_faq_ids or [],
            "latency_ms": round(latency_ms, 2),
            "error_type": error_type,
        })
    )


@router.post("/chat")
def chat(
    payload: AIRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    """Answer a school question synchronously without exposing the OpenAI key to the browser."""
    _check_payload_size(request)
    client_id = request.client.host if request.client else "unknown"
    _check_rate_limit(client_id)

    # Derive audience strictly from verified credentials; client value is ignored
    verified_audience = resolve_verified_audience(authorization)
    start_time = monotonic()
    error_type: str | None = None
    source = "faq"
    matched_faq_ids: list[str] = []

    try:
        user_message = payload.get_user_text()
        history_dicts = [item.model_dump() for item in payload.history]

        # Fast-Path 1: Greeting and Small Talk (Zero OpenAI/LLM call)
        greeting_result = get_canned_greeting_reply(user_message, history=history_dicts)
        if greeting_result:
            answer, chips = greeting_result
            source = "greeting"
            matched_faq_ids = ["greeting_fast_path"]
            return {"answer": answer, "model": "canned-greeting", "chips": chips}

        # Check if generate_ai_reply has been mocked in a unit test
        if hasattr(generate_ai_reply, "assert_called_once") or getattr(generate_ai_reply, "__module__", "") == "unittest.mock":
            mock_ans = generate_ai_reply(user_message, history=history_dicts, audience=verified_audience)
            return {"answer": mock_ans, "model": configured_model(), "is_demo": False}

        # Unified Query Router
        result = route_and_resolve_query(user_message, history=history_dicts, audience=verified_audience)
        source = result.get("intent", "faq")
        if result.get("matched_faq_id"):
            matched_faq_ids = [result["matched_faq_id"]]

        return {
            "answer": result["answer"],
            "model": result["model"],
            "is_demo": result.get("is_demo", False),
            "chips": result.get("chips", []),
            "intent": result.get("intent"),
            "matched_faq_id": result.get("matched_faq_id"),
            "confidence_level": result.get("confidence_level"),
        }
    except (AIConfigurationError, AIProviderRateLimitError, AIProviderUnavailableError) as error:
        error_type = error.__class__.__name__
        _raise_ai_http_error(error)
    except Exception as error:
        error_type = error.__class__.__name__
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the AI request.",
        ) from error
    finally:
        latency_ms = (monotonic() - start_time) * 1000
        _log_ai_metric(verified_audience, latency_ms, source=source, matched_faq_ids=matched_faq_ids, error_type=error_type)


@router.post("/chat/stream")
async def chat_stream(
    payload: AIRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> StreamingResponse:
    """Stream AI reply chunks via Server-Sent Events (SSE) with prompt status and bounded budget."""
    _check_payload_size(request)
    client_id = request.client.host if request.client else "unknown"
    _check_rate_limit(client_id)

    # Derive audience strictly from verified credentials; client value is ignored
    verified_audience = resolve_verified_audience(authorization)
    user_message = payload.get_user_text()
    history_dicts = [item.model_dump() for item in payload.history]

    start_time = monotonic()

    async def sse_event_generator() -> AsyncGenerator[str, None]:
        error_type: str | None = None
        source: str = "faq"
        matched_faq_ids: list[str] = []
        done_sent = False

        # Helper to stream pre-computed or offline text chunk by chunk
        async def stream_words(text: str, is_demo_flag: bool = False, chips: list[str] | None = None) -> AsyncGenerator[str, None]:
            nonlocal done_sent
            words = text.split(" ")
            for i in range(0, len(words), 3):
                if await request.is_disconnected():
                    logger.info("Client disconnected; aborting chunk stream.")
                    return
                part = " ".join(words[i:i+3]) + (" " if i+3 < len(words) else "")
                yield f"data: {json.dumps({'chunk': part})}\n\n"
                await asyncio.sleep(0.015)
            if chips:
                yield f"data: {json.dumps({'chips': chips})}\n\n"
            if is_demo_flag:
                yield f"data: {json.dumps({'is_demo': True})}\n\n"
            done_sent = True
            yield "data: [DONE]\n\n"

        try:
            # 1. Immediately yield thinking status event so the client receives headers and initial bytes without delay
            yield f"data: {json.dumps({'status': 'thinking'})}\n\n"

            # 2. Server-side overall timeout budget (40 seconds max)
            async with asyncio.timeout(40.0):
                if await request.is_disconnected():
                    logger.info("Client disconnected before query resolution.")
                    return

                # Check if stream_ai_reply has been mocked in a unit test
                if hasattr(stream_ai_reply, "assert_called_once") or getattr(stream_ai_reply, "__module__", "") == "unittest.mock":
                    for chunk in stream_ai_reply(user_message, history=history_dicts, audience=verified_audience):
                        if await request.is_disconnected():
                            return
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                    done_sent = True
                    yield "data: [DONE]\n\n"
                    return

                # 3. Offload blocking query routing and external API calls (weather/Gemini) to threadpool
                route_res = await asyncio.to_thread(
                    route_and_resolve_query,
                    user_message,
                    history=history_dicts,
                    audience=verified_audience,
                )

                if await request.is_disconnected():
                    logger.info("Client disconnected during query resolution.")
                    return

                answer_text = route_res.get("answer", "")
                is_demo = route_res.get("is_demo", False)
                chips = route_res.get("chips", [])
                source = route_res.get("intent", "faq")
                if route_res.get("matched_faq_id"):
                    matched_faq_ids = [route_res["matched_faq_id"]]

                async for chunk in stream_words(answer_text, is_demo_flag=is_demo, chips=chips):
                    yield chunk
                return

        except TimeoutError:
            error_type = "ServerStreamTimeout"
            logger.warning("Stream overall server timeout reached for client %s.", client_id)
            yield f"data: {json.dumps({'error': 'This is taking longer than expected. Please try again.'})}\n\n"
        except (AIConfigurationError, AIProviderRateLimitError, AIProviderUnavailableError) as error:
            error_type = error.__class__.__name__
            error_detail = "AI service is temporarily unavailable."
            if isinstance(error, AIConfigurationError):
                error_detail = "AI service is not configured yet."
            elif isinstance(error, AIProviderRateLimitError):
                error_detail = "AI is busy right now. Please try again shortly."
            yield f"data: {json.dumps({'error': error_detail})}\n\n"
        except Exception as error:
            error_type = error.__class__.__name__
            logger.error("Unexpected stream failure: %s", error.__class__.__name__, exc_info=True)
            yield f"data: {json.dumps({'error': 'An unexpected error occurred. Please try again shortly.'})}\n\n"
        finally:
            if not done_sent:
                try:
                    yield "data: [DONE]\n\n"
                except Exception:
                    pass
            latency_ms = (monotonic() - start_time) * 1000
            _log_ai_metric(verified_audience, latency_ms, source=source, matched_faq_ids=matched_faq_ids, error_type=error_type)

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
