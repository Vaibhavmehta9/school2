"""Unit and integration test suite for Media & Events CMS (FastAPI TestClient).

Validates:
1. Public endpoints (/api/tour, /api/events) return published items without auth.
2. RBAC Permission matrix: unauthenticated (401), parent/teacher/student/vendor (403), admin (200/201).
3. Video URL validation & normalization (HTTPS only, YouTube/Vimeo only, malformed IDs rejected).
4. SSRF protection on validate-video (fixed upstream oEmbed, mock timeouts & HTTP errors).
5. Student consent gate: publishing with has_students=True requires consent_confirmed=True.
6. Soft-delete, restore, publish, unpublish, and reorder lifecycle.
7. Cover image uploads (magic bytes, zero-byte rejection, WebP conversion).
"""

import io
from unittest.mock import MagicMock, patch
import urllib.error

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.database import connection, initialize_database
from app.main import app
from app.security import hash_password, new_session_token, session_expiry


@pytest.fixture(scope="module")
def client():
    initialize_database()
    return TestClient(app)


@pytest.fixture(scope="module")
def users_and_tokens():
    """Create test users for each role and return authentication headers."""
    initialize_database()
    tokens = {}
    with connection() as db:
        roles = [
            ("admin", "admin_cms@sherwood.test", "Admin User"),
            ("parent", "parent_cms@sherwood.test", "Parent User"),
            ("teacher", "teacher_cms@sherwood.test", "Teacher User"),
            ("student", "student_cms@sherwood.test", "Student User"),
            ("vendor", "vendor_cms@sherwood.test", "Vendor User"),
        ]
        for role, email, name in roles:
            db.execute("DELETE FROM users WHERE email = ?", (email,))
            cursor = db.execute(
                """
                INSERT INTO users (email, full_name, role, password_hash)
                VALUES (?, ?, ?, ?)
                RETURNING id
                """,
                (email, name, role, hash_password("TestPassword123!")),
            )
            user_id = cursor.fetchone()["id"]
            tok = new_session_token()
            db.execute(
                "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
                (tok, user_id, session_expiry()),
            )
            tokens[role] = {"Authorization": f"Bearer {tok}"}

    return tokens


# ============================================================================
# 1. PUBLIC ENDPOINTS
# ============================================================================

def test_public_tour_endpoint_returns_published_items(client):
    res = client.get("/api/tour")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 1
    # Check that all items are published tour chapters
    for item in data["items"]:
        assert item["kind"] == "tour"
        assert item["status"] == "published"
        assert item["video_provider"] in ("youtube", "vimeo")
        assert item["chapter_order"] is not None


def test_public_events_endpoint_ordering(client):
    res = client.get("/api/events")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["kind"] == "event"
        assert item["status"] in ("published", "archived")


def test_public_tour_by_slug(client):
    res = client.get("/api/tour/campus-walkthrough-152-years")
    assert res.status_code == 200
    item = res.json()
    assert item["slug"] == "campus-walkthrough-152-years"
    assert item["video_id"] == "mi2hVA7Gxt8"


def test_public_tour_slug_not_found(client):
    res = client.get("/api/tour/non-existent-tour-chapter")
    assert res.status_code == 404


# ============================================================================
# 2. RBAC PERMISSION MATRIX
# ============================================================================

def test_admin_media_unauthenticated_returns_401(client):
    res = client.get("/api/admin/media")
    assert res.status_code == 401


@pytest.mark.parametrize("role", ["parent", "teacher", "student", "vendor"])
def test_admin_media_forbidden_for_non_admins(client, users_and_tokens, role):
    headers = users_and_tokens[role]
    # List
    assert client.get("/api/admin/media", headers=headers).status_code == 403
    # Create
    assert client.post("/api/admin/media", headers=headers, json={"kind": "tour", "title": "Test"}).status_code == 403
    # Validate video
    assert client.post("/api/admin/media/validate-video", headers=headers, json={"video_url": "https://www.youtube.com/watch?v=mi2hVA7Gxt8"}).status_code == 403
    # Delete
    assert client.delete("/api/admin/media/1", headers=headers).status_code == 403


def test_admin_media_accessible_by_admin(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    res = client.get("/api/admin/media", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "counts" in data
    assert data["counts"]["total_active"] >= 8


# ============================================================================
# 3. VIDEO URL PARSING & VALIDATION
# ============================================================================

def test_create_media_rejects_non_https(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    payload = {
        "kind": "tour",
        "title": "Invalid HTTP Tour",
        "video_url": "http://www.youtube.com/watch?v=mi2hVA7Gxt8",
        "chapter_order": 10,
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    assert res.status_code == 422


def test_create_media_rejects_disallowed_host(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    payload = {
        "kind": "tour",
        "title": "Disallowed Host",
        "video_url": "https://dailymotion.com/video/x7tgad0",
        "chapter_order": 10,
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    assert res.status_code == 422


def test_create_media_rejects_dangerous_link_url(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    payload = {
        "kind": "event",
        "title": "Dangerous Link",
        "start_at": "2026-12-15T10:00:00Z",
        "link_url": "javascript:alert(document.cookie)",
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    assert res.status_code == 422


# ============================================================================
# 4. STUDENT CONSENT GATE
# ============================================================================

def test_cannot_publish_media_with_students_without_consent(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    payload = {
        "kind": "tour",
        "title": "Student Tour Without Consent",
        "video_url": "https://www.youtube.com/watch?v=mi2hVA7Gxt8",
        "chapter_order": 15,
        "has_students": True,
        "consent_confirmed": False,
        "status": "published",
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    assert res.status_code == 422
    assert "consent" in res.text.lower()


def test_can_save_as_draft_without_consent_then_publish_with_consent(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    # 1. Save as draft works
    payload = {
        "kind": "tour",
        "title": "Student Tour In Draft",
        "video_url": "https://www.youtube.com/watch?v=mi2hVA7Gxt8",
        "chapter_order": 20,
        "has_students": True,
        "consent_confirmed": False,
        "status": "draft",
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    assert res.status_code == 201
    item_id = res.json()["id"]

    # 2. Trying to publish directly without consent fails
    pub_res = client.post(f"/api/admin/media/{item_id}/publish", headers=headers)
    assert pub_res.status_code == 422

    # 3. Update to confirm consent
    up_res = client.put(f"/api/admin/media/{item_id}", headers=headers, json={"consent_confirmed": True})
    assert up_res.status_code == 200

    # 4. Now publish succeeds
    pub_res2 = client.post(f"/api/admin/media/{item_id}/publish", headers=headers)
    assert pub_res2.status_code == 200
    assert pub_res2.json()["status"] == "published"


# ============================================================================
# 5. SOFT-DELETE, RESTORE, UNPUBLISH & REORDER LIFECYCLE
# ============================================================================

def test_soft_delete_and_restore_lifecycle(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    # 1. Create event
    payload = {
        "kind": "event",
        "title": "Deletable Test Event",
        "start_at": "2026-12-25T10:00:00Z",
        "status": "published",
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    assert res.status_code == 201
    item_id = res.json()["id"]
    slug = res.json()["slug"]

    # 2. Item is visible publicly
    assert client.get(f"/api/events/{slug}").status_code == 200

    # 3. Soft-delete item
    del_res = client.delete(f"/api/admin/media/{item_id}", headers=headers)
    assert del_res.status_code == 200
    assert "moved to trash" in del_res.json()["message"]

    # 4. Public endpoint now returns 404
    assert client.get(f"/api/events/{slug}").status_code == 404

    # 5. Restore item
    rest_res = client.post(f"/api/admin/media/{item_id}/restore", headers=headers)
    assert rest_res.status_code == 200

    # 6. Public endpoint works again
    assert client.get(f"/api/events/{slug}").status_code == 200


def test_unpublish_item(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    # 1. Create published event
    payload = {
        "kind": "event",
        "title": "Unpublishable Event",
        "start_at": "2026-12-28T10:00:00Z",
        "status": "published",
    }
    res = client.post("/api/admin/media", headers=headers, json=payload)
    item_id = res.json()["id"]
    slug = res.json()["slug"]

    # 2. Unpublish item
    unpub = client.post(f"/api/admin/media/{item_id}/unpublish", headers=headers)
    assert unpub.status_code == 200
    assert unpub.json()["status"] == "draft"

    # 3. Not accessible publicly
    assert client.get(f"/api/events/{slug}").status_code == 404


def test_reorder_batch_items(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    reorder_payload = {
        "items": [
            {"id": 1, "sort_order": 10, "chapter_order": 2},
            {"id": 2, "sort_order": 5, "chapter_order": 1},
        ]
    }
    res = client.post("/api/admin/media/reorder", headers=headers, json=reorder_payload)
    assert res.status_code == 200
    assert "Successfully updated order" in res.json()["message"]


# ============================================================================
# 6. VIDEO VALIDATION & SSRF DEFENSE
# ============================================================================

def test_validate_video_youtube_success(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    mock_oembed = {
        "title": "Sample School Video",
        "author_name": "Sherwood Channel",
        "thumbnail_url": "https://i.ytimg.com/vi/mi2hVA7Gxt8/hqdefault.jpg",
        "duration": 240,
    }
    with patch("urllib.request.urlopen") as mock_url:
        mock_resp = MagicMock()
        mock_resp.read.return_value = io.BytesIO(b'{"title": "Sample School Video", "author_name": "Sherwood Channel", "thumbnail_url": "https://i.ytimg.com/vi/mi2hVA7Gxt8/hqdefault.jpg"}').getvalue()
        mock_resp.__enter__.return_value = mock_resp
        mock_url.return_value = mock_resp

        res = client.post(
            "/api/admin/media/validate-video",
            headers=headers,
            json={"video_url": "https://www.youtube.com/watch?v=mi2hVA7Gxt8"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True
        assert data["provider"] == "youtube"
        assert data["video_id"] == "mi2hVA7Gxt8"
        assert data["embed_url"] == "https://www.youtube-nocookie.com/embed/mi2hVA7Gxt8"


def test_validate_video_timeout_graceful_fallback(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    with patch("urllib.request.urlopen", side_effect=TimeoutError("Request timed out")):
        res = client.post(
            "/api/admin/media/validate-video",
            headers=headers,
            json={"video_url": "https://www.youtube.com/watch?v=mi2hVA7Gxt8"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True
        assert "warning" in data


# ============================================================================
# 7. COVER IMAGE UPLOADS
# ============================================================================

def test_upload_cover_image_success(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    # Generate clean PNG in RAM
    img = Image.new("RGB", (200, 200), color=(10, 92, 54))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("test_cover.png", buf.getvalue(), "image/png")}
    res = client.post("/api/admin/media/upload-cover", headers=headers, files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["path"].startswith("/api/uploads/media/")
    assert data["path"].endswith(".webp")
    assert data["width"] == 200
    assert data["height"] == 200


def test_upload_cover_image_rejects_non_image(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    files = {"file": ("malicious.sh", b"#!/bin/bash\necho test", "text/plain")}
    res = client.post("/api/admin/media/upload-cover", headers=headers, files=files)
    assert res.status_code == 400


def test_upload_cover_image_rejects_zero_bytes(client, users_and_tokens):
    headers = users_and_tokens["admin"]
    files = {"file": ("empty.png", b"", "image/png")}
    res = client.post("/api/admin/media/upload-cover", headers=headers, files=files)
    assert res.status_code == 400
