"""
Functional API test suite for Sheerwood College Admission Portal.
Tests role authorization, IDOR protection, document upload validation, and vendor isolation.
"""

import hashlib
import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="module")
def api_client():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        yield client

def login_user(client: httpx.Client, email: str, password: str, role: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# 1. AUTH & ROLE BOUNDARY TESTS
def test_login_and_role_access(api_client):
    # Parent token
    parent_token = login_user(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    # Admin token
    admin_token = login_user(api_client, "qa.admin01@example.com", "QAadmin@2027", "admin")
    # Teacher token
    teacher_token = login_user(api_client, "qa.teacher01@example.com", "QAteach@2027", "teacher")
    # Student token
    student_token = login_user(api_client, "qa.student01@example.com", "QAstud@2027", "student")

    # Parent accessing /api/dashboard/parent -> 200
    res = api_client.get("/api/dashboard/parent", headers={"Authorization": f"Bearer {parent_token}"})
    assert res.status_code == 200

    # Student accessing /api/dashboard/parent -> 403 Forbidden
    res = api_client.get("/api/dashboard/parent", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

    # Teacher accessing /api/dashboard/parent -> 403 Forbidden
    res = api_client.get("/api/dashboard/parent", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res.status_code == 403

    # Parent accessing /api/students (admin/teacher only) -> 403 Forbidden
    res = api_client.get("/api/students", headers={"Authorization": f"Bearer {parent_token}"})
    assert res.status_code == 403

    # Teacher accessing /api/students -> 200
    res = api_client.get("/api/students", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res.status_code == 200

    # Admin accessing /api/students -> 200
    res = api_client.get("/api/students", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200

# 2. DOCUMENT UPLOAD VALIDATION TESTS
def test_document_upload_validations(api_client):
    parent_token = login_user(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")
    app_num = "APP-2027-QA001"

    # A. Oversized file (> 5MB) -> HTTP 413
    oversized_data = b"%PDF-1.4\n" + b"A" * (5500000)
    files = {"file": ("large_doc.pdf", oversized_data, "application/pdf")}
    res = api_client.post(
        f"/api/applications/{app_num}/documents/student-photo",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 413
    assert "no larger than 5 MB" in res.json()["detail"]

    # B. Unsupported file type (.exe) -> HTTP 415
    invalid_data = b"MZ\x90\x00\x03\x00\x00\x00"
    files = {"file": ("malicious.exe", invalid_data, "application/octet-stream")}
    res = api_client.post(
        f"/api/applications/{app_num}/documents/student-photo",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 415
    assert "valid PDF, JPG, or PNG" in res.json()["detail"]

    # C. Valid PNG document -> HTTP 201
    valid_png = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    files = {"file": ("photo.png", valid_png, "image/png")}
    res = api_client.post(
        f"/api/applications/{app_num}/documents/student-photo",
        files=files,
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 201
    assert res.json()["document_key"] == "student-photo"

# 3. IDOR PROTECTION: PARENT 2 CANNOT ACCESS PARENT 1 APPLICATION
def test_idor_cross_parent_isolation(api_client):
    parent2_token = login_user(api_client, "qa.parent02@example.com", "QAtest@2027", "parent")
    app_num_p1 = "APP-2027-QA001"

    # Parent 2 attempts to fetch Parent 1 status -> 404 (or 403, application not owned)
    res = api_client.get(
        f"/api/applications/{app_num_p1}/status",
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code == 404

    # Parent 2 attempts to upload document to Parent 1 application -> 404
    valid_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
    files = {"file": ("doc.pdf", valid_pdf, "application/pdf")}
    res = api_client.post(
        f"/api/applications/{app_num_p1}/documents/birth-certificate",
        files=files,
        headers={"Authorization": f"Bearer {parent2_token}"}
    )
    assert res.status_code == 404
