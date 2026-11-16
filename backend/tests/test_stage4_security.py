"""
STAGE 4: Complete Security and Access Control Test Suite.
Tests IDOR, Privilege Escalation, Auth Bypass, Input Injection (SQLi/XSS), File Upload Security & Rate Limiting.
"""

import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = Path(__file__).resolve().parents[1] / "sheerwood.db"

@pytest.fixture(scope="module")
def api_client():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        yield client

def get_token(client: httpx.Client, email: str, password: str, role: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# -------------------------------------------------------------
# 1. IDOR (INSECURE DIRECT OBJECT REFERENCE) TESTS
# -------------------------------------------------------------
def test_idor_parent_application_status(api_client):
    parent2_token = get_token(api_client, "qa.parent02@example.com", "QAtest@2027", "parent")
    # Parent 2 tries to read Parent 1's application
    res = api_client.get(
        "/api/applications/APP-2027-QA001/status",
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code == 404, "Parent 2 should not be able to read Parent 1's application status"

def test_idor_parent_document_upload(api_client):
    parent2_token = get_token(api_client, "qa.parent02@example.com", "QAtest@2027", "parent")
    valid_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
    files = {"file": ("report.pdf", valid_pdf, "application/pdf")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code == 404, "Parent 2 should not be able to upload documents to Parent 1's application"

def test_idor_parent_document_download(api_client):
    parent2_token = get_token(api_client, "qa.parent02@example.com", "QAtest@2027", "parent")
    res = api_client.get(
        "/api/applications/APP-2027-QA001/documents/student-photo",
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code == 404, "Parent 2 should not be able to download Parent 1's documents"

def test_idor_parent_document_delete(api_client):
    parent2_token = get_token(api_client, "qa.parent02@example.com", "QAtest@2027", "parent")
    res = api_client.delete(
        "/api/applications/APP-2027-QA001/documents/student-photo",
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code == 404, "Parent 2 should not be able to delete Parent 1's documents"

def test_idor_parent_draft_hijack(api_client):
    parent2_token = get_token(api_client, "qa.parent02@example.com", "QAtest@2027", "parent")
    # Parent 2 tries to hijack Parent 1's application number via draft save
    res = api_client.put(
        "/api/applications/draft",
        json={"application_number": "APP-2027-QA001", "student_name": "Hijacked Name"},
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code in (404, 409), "Draft save must reject claiming another parent's application number"

# -------------------------------------------------------------
# 2. PRIVILEGE ESCALATION TESTS
# -------------------------------------------------------------
def test_privilege_escalation_parent(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")

    # Parent attempting Admin routes
    admin_routes = [
        ("GET", "/api/admin/admissions"),
        ("GET", "/api/admin/vendors"),
        ("POST", "/api/admin/vendors"),
        ("GET", "/api/admin/settings"),
        ("PATCH", "/api/admin/settings/registration-fee"),
        ("PATCH", "/api/applications/1/decision"),
    ]
    for method, route in admin_routes:
        res = api_client.request(method, route, headers={"Authorization": f"Bearer {parent_token}"})
        assert res.status_code == 403, f"Parent should be forbidden from {method} {route}, got {res.status_code}"

def test_privilege_escalation_student(api_client):
    student_token = get_token(api_client, "qa.student01@example.com", "QAstud@2027", "student")

    forbidden_routes = [
        ("GET", "/api/admin/admissions"),
        ("GET", "/api/students"),
        ("GET", "/api/teachers"),
        ("GET", "/api/admin/settings"),
        ("GET", "/api/dashboard/parent"),
        ("GET", "/api/dashboard/teacher"),
    ]
    for method, route in forbidden_routes:
        res = api_client.request(method, route, headers={"Authorization": f"Bearer {student_token}"})
        assert res.status_code == 403, f"Student should be forbidden from {method} {route}, got {res.status_code}"

def test_privilege_escalation_teacher(api_client):
    teacher_token = get_token(api_client, "qa.teacher01@example.com", "QAteach@2027", "teacher")

    forbidden_routes = [
        ("GET", "/api/admin/admissions"),
        ("POST", "/api/admin/vendors"),
        ("GET", "/api/admin/settings"),
        ("PATCH", "/api/admin/settings/registration-fee"),
        ("PATCH", "/api/applications/1/decision"),
    ]
    for method, route in forbidden_routes:
        res = api_client.request(method, route, headers={"Authorization": f"Bearer {teacher_token}"})
        assert res.status_code == 403, f"Teacher should be forbidden from {method} {route}, got {res.status_code}"

# -------------------------------------------------------------
# 3. AUTH BYPASS & TOKEN TAMPERING
# -------------------------------------------------------------
def test_auth_missing_token(api_client):
    res = api_client.get("/api/auth/me")
    assert res.status_code == 401
    assert "token is required" in res.json()["detail"].lower()

def test_auth_invalid_token(api_client):
    res = api_client.get("/api/auth/me", headers={"Authorization": "Bearer random_nonexistent_token_12345"})
    assert res.status_code == 401
    assert "invalid or has expired" in res.json()["detail"].lower()

def test_auth_malformed_header(api_client):
    res = api_client.get("/api/auth/me", headers={"Authorization": "Token some_token"})
    assert res.status_code == 401

def test_auth_expired_session(api_client):
    # Insert a guaranteed expired token into SQLite
    expired_token = "qa_expired_test_token_9999"
    expired_time = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT OR REPLACE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (expired_token, 1, expired_time))
    conn.commit()
    conn.close()

    res = api_client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()

def test_auth_review_mock_token_rejected_by_backend(api_client):
    # Proves review-mock-token cannot be used to forge backend requests
    res = api_client.get("/api/auth/me", headers={"Authorization": "Bearer review-mock-token"})
    assert res.status_code == 401

# -------------------------------------------------------------
# 4. INPUT INJECTION (SQLi & XSS)
# -------------------------------------------------------------
def test_sqli_in_login(api_client):
    sqli_payloads = [
        "' OR '1'='1",
        "admin'--",
        "qa.parent01@example.com' OR 1=1 --",
        "qa.admin01@example.com' /*",
    ]
    for payload in sqli_payloads:
        res = api_client.post("/api/auth/login", json={"email": payload, "password": "password", "role": "admin"})
        assert res.status_code == 401, f"SQLi payload '{payload}' should not bypass login"

def test_sqli_in_path_parameter(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    res = api_client.get(
        "/api/applications/' OR '1'='1/status",
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 404

def test_xss_in_draft_storage(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    xss_payload = "<script>alert('XSS-TEST')</script>"
    res = api_client.put(
        "/api/applications/draft",
        json={"application_number": "APP-2027-QA001", "student_name": xss_payload},
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 200
    # Retrieve status and verify stored string did not execute or crash API
    status_res = api_client.get(
        "/api/applications/APP-2027-QA001/status",
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert status_res.status_code == 200
    # Clean up name back to safe
    api_client.put(
        "/api/applications/draft",
        json={"application_number": "APP-2027-QA001", "student_name": "QA Test Child 001"},
        headers={"Authorization": f"Bearer {parent_token}"}
    )

# -------------------------------------------------------------
# 5. FILE UPLOAD SECURITY TESTS
# -------------------------------------------------------------
def test_upload_executable_masquerading_as_pdf(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    fake_pdf = b"MZ\x90\x00\x03\x00\x00\x00malicious binary content"
    files = {"file": ("exploit.pdf", fake_pdf, "application/pdf")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 415, "Server must inspect magic bytes and reject PE executable"

def test_upload_html_and_svg_scripts(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")

    # HTML
    html_content = b"<html><body><script>alert('XSS')</script></body></html>"
    files = {"file": ("page.html", html_content, "text/html")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 415

    # SVG with script
    svg_content = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert('SVG XSS')</script></svg>"
    files = {"file": ("vector.svg", svg_content, "image/svg+xml")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 415

def test_upload_php_webshell(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    php_content = b"<?php echo shell_exec($_GET['cmd']); ?>"
    files = {"file": ("shell.php", php_content, "application/x-php")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 415

def test_upload_double_extension(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    exe_content = b"MZ\x90\x00\x03\x00\x00\x00"
    files = {"file": ("document.pdf.exe", exe_content, "application/octet-stream")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 415

def test_upload_path_traversal_filename(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    valid_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
    # Filename with path traversal sequences
    files = {"file": ("../../../../etc/passwd.pdf", valid_pdf, "application/pdf")}
    res = api_client.post(
        "/api/applications/APP-2027-QA001/documents/report-card",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 201
    stored_name = res.json()["file_name"]
    assert "../" not in stored_name and "..\\" not in stored_name, "Stored filename must be sanitized against path traversal"

# -------------------------------------------------------------
# 6. RATE LIMITING TESTS
# -------------------------------------------------------------
def test_otp_rate_limiting(api_client):
    # OTP rate limit threshold is 3 per hour from same client IP
    responses = []
    for _ in range(5):
        res = api_client.post("/api/auth/otp/request", json={"phone_number": "+919876543299"})
        responses.append(res.status_code)

    assert 429 in responses, f"Rapid OTP requests should trigger HTTP 429 rate limit. Codes: {responses}"
