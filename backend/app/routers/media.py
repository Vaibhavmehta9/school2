from datetime import UTC, datetime
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Response, status

from ..database import connection

router = APIRouter(tags=["Media Public"])
logger = logging.getLogger(__name__)

SAFE_PUBLIC_COLUMNS = """
    id, kind, title, slug, summary, description, category, chapter_order,
    start_at, end_at, all_day, location, video_provider, video_id,
    video_embed_url, video_poster_url, cover_image_path, duration_seconds,
    link_url, link_label, status, featured, sort_order, demo, source_credit
"""


@router.get("/api/tour", response_model=dict[str, Any])
def list_public_tour_chapters(response: Response) -> dict[str, Any]:
    """Return published Virtual Tour video chapters ordered sequentially by chapter order."""
    now = datetime.now(UTC).isoformat()
    query = f"""
        SELECT {SAFE_PUBLIC_COLUMNS}
        FROM media_items
        WHERE kind = 'tour'
          AND deleted_at IS NULL
          AND status = 'published'
        ORDER BY
            chapter_order ASC,
            sort_order ASC,
            id ASC
    """
    with connection() as database:
        rows = database.execute(query).fetchall()

    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    items = [dict(r) for r in rows]
    return {
        "items": items,
        "total": len(items),
        "server_time": now
    }


@router.get("/api/tour/{slug}", response_model=dict[str, Any])
def get_public_tour_chapter(slug: str, response: Response) -> dict[str, Any]:
    """Retrieve full details of a published tour chapter by slug."""
    query = f"""
        SELECT {SAFE_PUBLIC_COLUMNS}
        FROM media_items
        WHERE kind = 'tour'
          AND slug = ?
          AND deleted_at IS NULL
          AND status = 'published'
    """
    with connection() as database:
        row = database.execute(query, (slug,)).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tour chapter not found or is no longer available."
        )

    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return dict(row)


@router.get("/api/events", response_model=dict[str, Any])
def list_public_events(
    response: Response,
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    category: str | None = None,
    include_archived: bool = Query(default=False),
) -> dict[str, Any]:
    """Return published events for public site consumption.

    Ordering:
    1. Ongoing events (start_at <= now <= end_at)
    2. Upcoming events (start_at > now), soonest first
    3. Recent past events (end_at < now or start_at < now), newest first
    """
    now = datetime.now(UTC).isoformat()
    status_filter = ("published", "archived") if include_archived else ("published",)
    status_placeholders = ",".join("?" for _ in status_filter)

    query = f"""
        SELECT {SAFE_PUBLIC_COLUMNS}
        FROM media_items
        WHERE kind = 'event'
          AND deleted_at IS NULL
          AND status IN ({status_placeholders})
    """
    params: list[Any] = list(status_filter)

    if category:
        query += " AND category = ?"
        params.append(category)

    count_query = f"""
        SELECT COUNT(*) as total
        FROM media_items
        WHERE kind = 'event'
          AND deleted_at IS NULL
          AND status IN ({status_placeholders})
    """
    count_params = list(status_filter)
    if category:
        count_query += " AND category = ?"
        count_params.append(category)

    order_clause = f"""
        ORDER BY
            CASE
                WHEN start_at <= '{now}' AND (end_at IS NOT NULL AND end_at >= '{now}') THEN 1
                WHEN start_at > '{now}' THEN 2
                ELSE 3
            END ASC,
            CASE
                WHEN start_at > '{now}' THEN start_at
            END ASC,
            sort_order ASC,
            start_at DESC
        LIMIT ? OFFSET ?
    """
    query += order_clause
    params.extend([limit, offset])

    with connection() as database:
        total = database.execute(count_query, count_params).fetchone()["total"]
        rows = database.execute(query, params).fetchall()

    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    events = [dict(row) for row in rows]
    return {
        "items": events,
        "total": total,
        "limit": limit,
        "offset": offset,
        "server_time": now
    }


@router.get("/api/events/{slug}", response_model=dict[str, Any])
def get_public_event(slug: str, response: Response) -> dict[str, Any]:
    """Retrieve full details of a published or archived event by slug."""
    query = f"""
        SELECT {SAFE_PUBLIC_COLUMNS}
        FROM media_items
        WHERE kind = 'event'
          AND slug = ?
          AND deleted_at IS NULL
          AND status IN ('published', 'archived')
    """
    with connection() as database:
        row = database.execute(query, (slug,)).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or is no longer available."
        )

    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return dict(row)

