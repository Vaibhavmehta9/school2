"""Verify demo mode settings, docs protection, and rate limiting."""

import os
os.environ["DEMO_MODE"] = "true"
os.environ["DATABASE_PATH"] = "sheerwood.demo.db"
os.environ["AI_RATE_LIMIT_REQUESTS"] = "5"
os.environ["AI_RATE_LIMIT_WINDOW_SECONDS"] = "60"

from fastapi.testclient import TestClient
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.main import app

# Wrap with ProxyHeadersMiddleware to simulate uvicorn --proxy-headers
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["testclient", "127.0.0.1"])
client = TestClient(app)

print("--- Test 7: Verify /docs, /redoc, /openapi.json disabled in DEMO_MODE ---")
r_docs = client.get("/docs")
print(f"GET /docs: status {r_docs.status_code} (Expected 404)")
assert r_docs.status_code == 404, f"Expected 404 but got {r_docs.status_code}"

r_redoc = client.get("/redoc")
print(f"GET /redoc: status {r_redoc.status_code} (Expected 404)")
assert r_redoc.status_code == 404, f"Expected 404 but got {r_redoc.status_code}"

r_openapi = client.get("/openapi.json")
print(f"GET /openapi.json: status {r_openapi.status_code} (Expected 404)")
assert r_openapi.status_code == 404, f"Expected 404 but got {r_openapi.status_code}"
print("[PASS] Test 7: API docs and OpenAPI specs are disabled.")

print("\n--- Test 6: AI Chat Fallback Non-Streaming Response Verification ---")
res_normal = client.post("/api/ai/chat", json={"message": "hello", "history": []}, headers={"x-forwarded-for": "203.0.113.10"})
print(f"POST /api/ai/chat status: {res_normal.status_code}")
assert res_normal.status_code == 200
print(f"AI Response keys: {list(res_normal.json().keys())}")
print("[PASS] Test 6: Non-streaming /api/ai/chat works cleanly.")

print("\n--- Test 8: Rate limit on AI endpoint triggers as expected ---")
# Send 4 more requests for IP 203.0.113.10 (total 5)
for i in range(4):
    res = client.post("/api/ai/chat", json={"message": "hello", "history": []}, headers={"x-forwarded-for": "203.0.113.10"})
    assert res.status_code == 200, f"Request {i+2} failed with {res.status_code}"

# 6th request from same IP should trigger 429 Too Many Requests
r_limit = client.post("/api/ai/chat", json={"message": "hello", "history": []}, headers={"x-forwarded-for": "203.0.113.10"})
print(f"6th request status for 203.0.113.10: {r_limit.status_code} (Expected 429)")
assert r_limit.status_code == 429, f"Expected 429 but got {r_limit.status_code}"
print(f"429 Response detail: {r_limit.json()}")

# But a request from a different IP (203.0.113.20) should succeed (proving per-IP isolation)!
r_diff_ip = client.post("/api/ai/chat", json={"message": "hello", "history": []}, headers={"x-forwarded-for": "203.0.113.20"})
print(f"Request from different IP 203.0.113.20 status: {r_diff_ip.status_code} (Expected 200)")
assert r_diff_ip.status_code == 200

print("[PASS] Test 8: AI chat rate limiting successfully triggered 429 per-IP and allowed other IPs.")
print("\nALL BACKEND DEMO TESTS PASSED!")
