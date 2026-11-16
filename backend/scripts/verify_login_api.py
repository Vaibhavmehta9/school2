import httpx

BASE_URL = "http://127.0.0.1:8000"

users = [
    ("qa.parent01@example.com", "QAtest@2027", "parent"),
    ("qa.parent02@example.com", "QAtest@2027", "parent"),
    ("qa.admin01@example.com", "QAadmin@2027", "admin"),
    ("qa.teacher01@example.com", "QAteach@2027", "teacher"),
    ("qa.student01@example.com", "QAstud@2027", "student"),
]

with httpx.Client(base_url=BASE_URL, timeout=5.0) as client:
    health = client.get("/api/health")
    print(f"GET /api/health: {health.status_code} {health.json()}")

    for email, password, role in users:
        res = client.post("/api/auth/login", json={"email": email, "password": password, "role": role})
        print(f"Login {role} ({email}): {res.status_code}")
        if res.status_code == 200:
            token = res.json()["access_token"]
            me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
            print(f"  -> /api/auth/me: {me_res.status_code} {me_res.json()}")
        else:
            print(f"  -> Error: {res.text}")

