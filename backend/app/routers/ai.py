"""Public, rate-limited AI chat endpoint used by the portal's AI widgets."""

from __future__ import annotations

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
    stream_ai_reply,
)
from ..dependencies import resolve_verified_audience
from ..schemas import AIRequest

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
    limit = _setting("AI_RATE_LIMIT_REQUESTS", 10)
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


def _log_ai_metric(audience: str, latency_ms: float, error_type: str | None = None) -> None:
    """Log privacy-safe metrics only (no personal data or message content)."""
    logger.info(
        json.dumps({
            "timestamp": int(time()),
            "audience": audience,
            "latency_ms": round(latency_ms, 2),
            "error_type": error_type,
        })
    )


@router.post("/chat")
def chat(
    payload: AIRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Answer a school question synchronously without exposing the OpenAI key to the browser."""
    _check_payload_size(request)
    client_id = request.client.host if request.client else "unknown"
    _check_rate_limit(client_id)

    # Derive audience strictly from verified credentials; client value is ignored
    verified_audience = resolve_verified_audience(authorization)
    start_time = monotonic()
    error_type: str | None = None

    try:
        user_message = payload.get_user_text()
        history_dicts = [item.model_dump() for item in payload.history]
        answer = generate_ai_reply(user_message, history=history_dicts, audience=verified_audience)
        return {"answer": answer, "model": configured_model()}
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
        _log_ai_metric(verified_audience, latency_ms, error_type)


@router.post("/chat/stream")
async def chat_stream(
    payload: AIRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> StreamingResponse:
    """Stream AI reply chunks via Server-Sent Events (SSE)."""
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
        try:
            # Run generator in threadpool to allow cooperative async checking of client disconnect
            generator = stream_ai_reply(user_message, history=history_dicts, audience=verified_audience)

            def get_next_chunk():
                try:
                    return next(generator)
                except StopIteration:
                    return None

            while True:
                if await request.is_disconnected():
                    # Stop processing when the client disconnects or clicks "Stop generating"
                    break
                chunk = await run_in_threadpool(get_next_chunk)
                if chunk is None:
                    break
                # Yield SSE JSON data chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            yield "data: [DONE]\n\n"
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
            yield f"data: {json.dumps({'error': 'An unexpected error occurred.'})}\n\n"
        finally:
            latency_ms = (monotonic() - start_time) * 1000
            _log_ai_metric(verified_audience, latency_ms, error_type)

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
