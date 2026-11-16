"""
STAGE 6: Performance, Resilience, and Boundary Testing.
Tests API Latency, Unicode / Extreme String Boundaries, Concurrency, and Database Integrity.
"""

import time
import concurrent.futures
from pathlib import Path
import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="module")
def api_client():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        yield client

def get_token(client: httpx.Client, email: str, password: str, role: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# -------------------------------------------------------------
# 1. RESPONSE TIME & LATENCY CHECKS (< 500ms)
# -------------------------------------------------------------
def test_endpoint_latencies_under_500ms(api_client):
    admin_token = get_token(api_client, "qa.admin01@example.com", "QAadmin@2027", "admin")
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")

    endpoints = [
        ("GET", "/api/health", {}),
        ("GET", "/api/auth/me", {"Authorization": f"Bearer {parent_token}"}),
        ("GET", "/api/applications/current/status", {"Authorization": f"Bearer {parent_token}"}),
        ("GET", "/api/dashboard/parent", {"Authorization": f"Bearer {parent_token}"}),
        ("GET", "/api/admin/admissions", {"Authorization": f"Bearer {admin_token}"}),
    ]

    for method, path, headers in endpoints:
        start_time = time.perf_counter()
        res = api_client.request(method, path, headers=headers)
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        assert res.status_code == 200, f"{path} returned {res.status_code}"
        assert duration_ms < 500.0, f"{path} exceeded 500ms latency: took {duration_ms:.2f}ms"
        print(f"Latency for {path}: {duration_ms:.2f}ms")

# -------------------------------------------------------------
# 2. PAYLOAD BOUNDARIES: UNICODE, EMOJIS, ACCENTS & EXTREME STRINGS
# -------------------------------------------------------------
def test_unicode_and_multilingual_payloads(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")

    multilingual_names = [
        "आरव कुमार शर्मा",                 # Devanagari (Hindi)
        "Élise Charlotte Müller",           # French / German accents
        "Student 🎓 🌟 📚 2027",            # Unicode Emojis
        "مرحبا بالعالم",                     # Arabic (RTL)
        "日本語テスト学生",                  # Japanese Kanji/Katakana
    ]

    for name in multilingual_names:
        res = api_client.put(
            "/api/applications/draft",
            json={
                "application_number": "APP-2027-QA001",
                "data": {"studentName": name, "class": "Class 8"}
            },
            headers={"Authorization": f"Bearer {parent_token}"}
        )
        assert res.status_code == 200, f"Failed saving draft with name '{name}': {res.text}"

        # Verify retrieved data preserves exact Unicode characters
        status_res = api_client.get(
            "/api/applications/APP-2027-QA001/status",
            headers={"Authorization": f"Bearer {parent_token}"}
        )
        assert status_res.status_code == 200
        assert status_res.json()["application"]["student_name"] == name

    # Restore clean name
    api_client.put(
        "/api/applications/draft",
        json={
            "application_number": "APP-2027-QA001",
            "data": {"studentName": "QA Test Child 001", "class": "Grade 8"}
        },
        headers={"Authorization": f"Bearer {parent_token}"}
    )

def test_extreme_payload_lengths(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")

    # 4,000 character notes / previous school
    long_string = "A" * 4000
    res = api_client.put(
        "/api/applications/draft",
        json={
            "application_number": "APP-2027-QA001",
            "student_name": "QA Test Child 001",
            "form_data": {"notes": long_string, "previousSchool": long_string}
        },
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert res.status_code == 200

def test_whitespace_and_empty_inputs(api_client):
    # Empty email in login
    res = api_client.post("/api/auth/login", json={"email": "   ", "password": "QAtest@2027", "role": "parent"})
    assert res.status_code in (400, 401, 422)

    # Empty registration fields
    res = api_client.post("/api/auth/register", json={
        "email": "",
        "first_name": "  ",
        "last_name": "",
        "password": ""
    })
    assert res.status_code in (400, 422)

# -------------------------------------------------------------
# 3. CONCURRENT UPDATES ON SAME APPLICATION
# -------------------------------------------------------------
def test_concurrent_draft_updates(api_client):
    parent_token = get_token(api_client, "qa.parent01@example.com", "QAtest@2027", "parent")

    def send_draft_update(index: int):
        with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
            return client.put(
                "/api/applications/draft",
                json={
                    "application_number": "APP-2027-QA001",
                    "data": {
                        "studentName": f"Concurrent Student {index}",
                        "class": "Class 8",
                    },
                },
                headers={"Authorization": f"Bearer {parent_token}"}
            )

    # Launch 6 concurrent requests simultaneously
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(send_draft_update, i) for i in range(6)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    # All should return valid HTTP 200 (or last-write-wins) without any 500 crashes or SQLite lock errors
    for res in results:
        assert res.status_code == 200, f"Concurrent update failed with status {res.status_code}: {res.text}"

    # Verify final state is valid and readable
    status_res = api_client.get(
        "/api/applications/APP-2027-QA001/status",
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert status_res.status_code == 200
    assert "Concurrent Student" in status_res.json()["application"]["student_name"]

    # Restore clean student name
    api_client.put(
        "/api/applications/draft",
        json={
            "application_number": "APP-2027-QA001",
            "data": {"studentName": "QA Test Child 001", "class": "Class 8"}
        },
        headers={"Authorization": f"Bearer {parent_token}"}
    )
