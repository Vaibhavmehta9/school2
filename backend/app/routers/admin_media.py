from datetime import UTC, datetime
import json
import logging
import re
import secrets
import urllib.parse
import urllib.request
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from ..database import connection
from ..dependencies import require_roles
from ..schemas import (
    MediaCreateRequest,
    MediaReorderRequest,
    MediaUpdateRequest,
    ValidateVideoRequest,
    parse_video_url,
)
from ..storage import get_storage_driver

router = APIRouter(prefix="/api/admin/media", tags=["Admin Media CMS"])
AdminUser = Annotated[dict[str, Any], Depends(require_roles("admin"))]
logger = logging.getLogger(__name__)


def generate_unique_slug(database: Any, title: str, exclude_id: int | None = None) -> str:
    """Generate a clean URL-friendly unique slug."""
    base_slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not base_slug:
        base_slug = f"media-{secrets.token_hex(4)}"

    slug = base_slug
    counter = 1
    while True:
        query = "SELECT id FROM media_items WHERE slug = ?"
        params: list[Any] = [slug]
        if exclude_id is not None:
            query += " AND id != ?"
            params.append(exclude_id)
        existing = database.execute(query, params).fetchone()
        if not existing:
            return slug
        counter += 1
        slug = f"{base_slug}-{counter}"


@router.get("", response_model=dict[str, Any])
def list_admin_media(
    admin: AdminUser,
    kind: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    category: str | None = None,
    search: str | None = None,
    include_deleted: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    """List media items for admin management with filters, search, and counters."""
    with connection() as database:
        stats_row = database.execute(
            """
            SELECT
                COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as total_active,
                COUNT(CASE WHEN status = 'published' AND deleted_at IS NULL THEN 1 END) as published_count,
                COUNT(CASE WHEN status = 'draft' AND deleted_at IS NULL THEN 1 END) as draft_count,
                COUNT(CASE WHEN status = 'archived' AND deleted_at IS NULL THEN 1 END) as archived_count,
                COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_count,
                COUNT(CASE WHEN kind = 'tour' AND deleted_at IS NULL THEN 1 END) as tour_count,
                COUNT(CASE WHEN kind = 'event' AND deleted_at IS NULL THEN 1 END) as event_count
            FROM media_items
            """
        ).fetchone()

        where_clauses: list[str] = []
        params: list[Any] = []

        if include_deleted:
            where_clauses.append("deleted_at IS NOT NULL")
        else:
            where_clauses.append("deleted_at IS NULL")
            if status_filter:
                where_clauses.append("status = ?")
                params.append(status_filter)

        if kind:
            where_clauses.append("kind = ?")
            params.append(kind)

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            where_clauses.append("(lower(title) LIKE ? OR lower(summary) LIKE ? OR lower(location) LIKE ?)")
            params.extend([term, term, term])

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        total = database.execute(
            f"SELECT COUNT(*) as count FROM media_items WHERE {where_sql}", params
        ).fetchone()["count"]

        query = f"""
            SELECT *
            FROM media_items
            WHERE {where_sql}
            ORDER BY
                CASE WHEN kind = 'tour' THEN chapter_order ELSE 999 END ASC,
                sort_order ASC,
                id DESC
            LIMIT ? OFFSET ?
        """
        rows = database.execute(query, params + [limit, offset]).fetchall()

    return {
        "items": [dict(r) for r in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
        "counts": {
            "total_active": stats_row["total_active"],
            "published": stats_row["published_count"],
            "draft": stats_row["draft_count"],
            "archived": stats_row["archived_count"],
            "deleted": stats_row["deleted_count"],
            "tour_count": stats_row["tour_count"],
            "event_count": stats_row["event_count"],
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_media_item(payload: MediaCreateRequest, admin: AdminUser) -> dict[str, Any]:
    """Create a new media item (tour chapter or campus event)."""
    now = datetime.now(UTC).isoformat()
    video_provider, video_id, video_embed_url, video_poster_url = parse_video_url(payload.video_url)

    # Use explicit poster_url if provided, otherwise parsed video poster
    final_poster = payload.poster_url or video_poster_url

    with connection() as database:
        slug = payload.slug.strip() if payload.slug else generate_unique_slug(database, payload.title)
        if payload.slug:
            existing = database.execute("SELECT id FROM media_items WHERE slug = ?", (slug,)).fetchone()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Slug '{slug}' is already in use. Please select a distinct slug.",
                )

        cursor = database.execute(
            """
            INSERT INTO media_items (
                kind, title, slug, summary, description, category, chapter_order,
                start_at, end_at, all_day, location, video_provider, video_id,
                video_url, video_embed_url, video_poster_url, cover_image_path,
                duration_seconds, link_url, link_label, status, featured, sort_order,
                demo, source_credit, has_students, consent_confirmed, created_by, updated_by,
                created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?
            )
            RETURNING *
            """,
            (
                payload.kind,
                payload.title,
                slug,
                payload.summary,
                payload.description,
                payload.category,
                payload.chapter_order,
                payload.start_at,
                payload.end_at,
                1 if payload.all_day else 0,
                payload.location,
                video_provider,
                video_id,
                payload.video_url,
                video_embed_url,
                final_poster,
                payload.cover_image_path,
                payload.duration_seconds,
                payload.link_url,
                payload.link_label,
                payload.status,
                1 if payload.featured else 0,
                payload.sort_order,
                1 if payload.demo else 0,
                payload.source_credit,
                1 if payload.has_students else 0,
                1 if payload.consent_confirmed else 0,
                str(admin["id"]),
                str(admin["id"]),
                now,
                now,
            ),
        )
        created_row = cursor.fetchone()

    logger.info("Admin %s created %s item id=%d ('%s')", admin["id"], payload.kind, created_row["id"], slug)
    return dict(created_row)


@router.get("/{item_id}")
def get_admin_media_item(item_id: int, admin: AdminUser) -> dict[str, Any]:
    """Retrieve full details of any media item (including drafts and soft-deleted)."""
    with connection() as database:
        row = database.execute("SELECT * FROM media_items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")
    return dict(row)


@router.put("/{item_id}")
def update_media_item(item_id: int, payload: MediaUpdateRequest, admin: AdminUser) -> dict[str, Any]:
    """Update an existing media item with validation."""
    now = datetime.now(UTC).isoformat()
    with connection() as database:
        existing = database.execute("SELECT * FROM media_items WHERE id = ?", (item_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")
        if existing["deleted_at"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit a deleted item. Restore it first.")

        # Resolve slug
        slug = existing["slug"]
        if payload.slug and payload.slug.strip() != slug:
            new_slug = payload.slug.strip()
            slug_exists = database.execute(
                "SELECT id FROM media_items WHERE slug = ? AND id != ?", (new_slug, item_id)
            ).fetchone()
            if slug_exists:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Slug '{new_slug}' is already in use.")
            slug = new_slug

        # Video resolution
        video_url = payload.video_url if payload.video_url is not None else existing["video_url"]
        if video_url:
            video_provider, video_id, video_embed_url, video_poster_url = parse_video_url(video_url)
        else:
            video_provider, video_id, video_embed_url, video_poster_url = "none", None, None, None

        has_students = payload.has_students if payload.has_students is not None else bool(existing["has_students"])
        consent_confirmed = payload.consent_confirmed if payload.consent_confirmed is not None else bool(existing["consent_confirmed"])
        target_status = payload.status or existing["status"]

        if target_status == "published" and has_students and not consent_confirmed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot publish media showing students without confirmed parental/guardian consent.",
            )

        cursor = database.execute(
            """
            UPDATE media_items
            SET
                kind = ?,
                title = ?,
                slug = ?,
                summary = ?,
                description = ?,
                category = ?,
                chapter_order = ?,
                start_at = ?,
                end_at = ?,
                all_day = ?,
                location = ?,
                video_provider = ?,
                video_id = ?,
                video_url = ?,
                video_embed_url = ?,
                video_poster_url = ?,
                cover_image_path = ?,
                duration_seconds = ?,
                link_url = ?,
                link_label = ?,
                status = ?,
                featured = ?,
                sort_order = ?,
                demo = ?,
                source_credit = ?,
                has_students = ?,
                consent_confirmed = ?,
                updated_by = ?,
                updated_at = ?
            WHERE id = ?
            RETURNING *
            """,
            (
                payload.kind or existing["kind"],
                payload.title if payload.title is not None else existing["title"],
                slug,
                payload.summary if payload.summary is not None else existing["summary"],
                payload.description if payload.description is not None else existing["description"],
                payload.category if payload.category is not None else existing["category"],
                payload.chapter_order if payload.chapter_order is not None else existing["chapter_order"],
                payload.start_at if payload.start_at is not None else existing["start_at"],
                payload.end_at if payload.end_at is not None else existing["end_at"],
                (1 if payload.all_day else 0) if payload.all_day is not None else existing["all_day"],
                payload.location if payload.location is not None else existing["location"],
                video_provider,
                video_id,
                video_url,
                video_embed_url,
                payload.poster_url or video_poster_url or existing["video_poster_url"],
                payload.cover_image_path if payload.cover_image_path is not None else existing["cover_image_path"],
                payload.duration_seconds if payload.duration_seconds is not None else existing["duration_seconds"],
                payload.link_url if payload.link_url is not None else existing["link_url"],
                payload.link_label if payload.link_label is not None else existing["link_label"],
                target_status,
                (1 if payload.featured else 0) if payload.featured is not None else existing["featured"],
                payload.sort_order if payload.sort_order is not None else existing["sort_order"],
                (1 if payload.demo else 0) if payload.demo is not None else existing["demo"],
                payload.source_credit if payload.source_credit is not None else existing["source_credit"],
                1 if has_students else 0,
                1 if consent_confirmed else 0,
                str(admin["id"]),
                now,
                item_id,
            ),
        )
        updated_row = cursor.fetchone()

    logger.info("Admin %s updated media item id=%d (%s)", admin["id"], item_id, slug)
    return dict(updated_row)


@router.delete("/{item_id}")
def delete_media_item(item_id: int, admin: AdminUser) -> dict[str, Any]:
    """Soft-delete a media item (sets deleted_at). Enables 1-click Undo / Restore."""
    now = datetime.now(UTC).isoformat()
    with connection() as database:
        existing = database.execute(
            "SELECT id, title, deleted_at FROM media_items WHERE id = ?", (item_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")
        if existing["deleted_at"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Media item is already deleted.")

        database.execute(
            "UPDATE media_items SET deleted_at = ?, updated_by = ?, updated_at = ? WHERE id = ?",
            (now, str(admin["id"]), now, item_id),
        )

    logger.info("Admin %s soft-deleted media item id=%d ('%s')", admin["id"], item_id, existing["title"])
    return {
        "message": f"'{existing['title']}' moved to trash.",
        "id": item_id,
        "deleted_at": now
    }


@router.post("/{item_id}/restore")
def restore_media_item(item_id: int, admin: AdminUser) -> dict[str, Any]:
    """Restore a soft-deleted media item."""
    now = datetime.now(UTC).isoformat()
    with connection() as database:
        existing = database.execute(
            "SELECT id, title, deleted_at FROM media_items WHERE id = ?", (item_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")
        if not existing["deleted_at"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Media item is not deleted.")

        database.execute(
            "UPDATE media_items SET deleted_at = NULL, updated_by = ?, updated_at = ? WHERE id = ?",
            (str(admin["id"]), now, item_id),
        )

    logger.info("Admin %s restored media item id=%d ('%s')", admin["id"], item_id, existing["title"])
    return {"message": f"'{existing['title']}' restored from trash.", "id": item_id}


@router.post("/{item_id}/publish")
def publish_media_item(item_id: int, admin: AdminUser) -> dict[str, Any]:
    """Publish a media item with student consent enforcement."""
    now = datetime.now(UTC).isoformat()
    with connection() as database:
        existing = database.execute("SELECT * FROM media_items WHERE id = ?", (item_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")
        if existing["deleted_at"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot publish a deleted item.")

        if existing["has_students"] and not existing["consent_confirmed"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot publish media showing students without confirmed parental/guardian consent.",
            )

        database.execute(
            "UPDATE media_items SET status = 'published', updated_at = ?, updated_by = ? WHERE id = ?",
            (now, str(admin["id"]), item_id),
        )

    logger.info("Admin %s published media item id=%d ('%s')", admin["id"], item_id, existing["title"])
    return {"message": "Item published.", "id": item_id, "status": "published"}


@router.post("/{item_id}/unpublish")
def unpublish_media_item(item_id: int, admin: AdminUser) -> dict[str, Any]:
    """Revert a published media item to draft (removes from site without deleting)."""
    now = datetime.now(UTC).isoformat()
    with connection() as database:
        existing = database.execute("SELECT * FROM media_items WHERE id = ?", (item_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")

        database.execute(
            "UPDATE media_items SET status = 'draft', updated_at = ?, updated_by = ? WHERE id = ?",
            (now, str(admin["id"]), item_id),
        )

    logger.info("Admin %s unpublished media item id=%d ('%s')", admin["id"], item_id, existing["title"])
    return {"message": "Item reverted to draft.", "id": item_id, "status": "draft"}


@router.post("/reorder")
def reorder_media_items(payload: MediaReorderRequest, admin: AdminUser) -> dict[str, Any]:
    """Batch update sort order and chapter sequence."""
    now = datetime.now(UTC).isoformat()
    with connection() as database:
        for item in payload.items:
            database.execute(
                """
                UPDATE media_items
                SET sort_order = ?,
                    chapter_order = COALESCE(?, chapter_order),
                    updated_at = ?,
                    updated_by = ?
                WHERE id = ?
                """,
                (item.sort_order, item.chapter_order, now, str(admin["id"]), item.id),
            )

    logger.info("Admin %s reordered %d media items", admin["id"], len(payload.items))
    return {"message": f"Successfully updated order of {len(payload.items)} items."}


@router.post("/validate-video")
def validate_video_url(payload: ValidateVideoRequest, admin: AdminUser) -> dict[str, Any]:
    """Validate YouTube or Vimeo video URL via upstream oEmbed.

    Uses fixed hardcoded upstream endpoints and a 4s timeout to prevent SSRF.
    """
    try:
        provider, video_id, embed_url, fallback_poster = parse_video_url(payload.video_url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if provider == "none" or not video_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video URL.")

    # Call fixed official oEmbed endpoints (No user-supplied hosts, 4s timeout)
    if provider == "youtube":
        canonical_url = f"https://www.youtube.com/watch?v={video_id}"
        oembed_endpoint = f"https://www.youtube.com/oembed?url={urllib.parse.quote(canonical_url)}&format=json"
    elif provider == "vimeo":
        canonical_url = f"https://vimeo.com/{video_id}"
        oembed_endpoint = f"https://vimeo.com/api/oembed.json?url={urllib.parse.quote(canonical_url)}"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported video provider.")

    req = urllib.request.Request(
        oembed_endpoint,
        headers={"User-Agent": "SherwoodCollege-CMS/1.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "valid": True,
                "provider": provider,
                "video_id": video_id,
                "embed_url": embed_url,
                "title": data.get("title", ""),
                "author_name": data.get("author_name", ""),
                "thumbnail_url": data.get("thumbnail_url") or fallback_poster,
                "duration_seconds": data.get("duration"),
            }
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found on the provider.") from exc
        if exc.code in (401, 403):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Video is private or embedding is restricted by owner.") from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Video provider returned an error.") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        # Fall back to parsed metadata gracefully if upstream oEmbed timed out
        logger.warning("oEmbed validation timed out for %s: %s", payload.video_url, exc)
        return {
            "valid": True,
            "provider": provider,
            "video_id": video_id,
            "embed_url": embed_url,
            "title": "",
            "author_name": "",
            "thumbnail_url": fallback_poster,
            "duration_seconds": None,
            "warning": "Live title autofill timed out, but video ID and embed URL were successfully verified."
        }


@router.post("/upload-cover")
def upload_cover_image(
    file: UploadFile = File(...),
    admin: AdminUser = None,
) -> dict[str, Any]:
    """Upload and optimize cover image (WebP, EXIF stripped, max 5MB)."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required.")

    content = file.file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file upload.")

    storage = get_storage_driver()
    result = storage.save_image(content, file.filename)
    logger.info("Admin %s uploaded media cover '%s' -> %s", admin["id"], file.filename, result["path"])
    return result

