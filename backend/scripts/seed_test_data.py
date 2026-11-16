"""
Seed test users and synthetic baseline data for QA automated testing.
Uses fake data only. Safe for local development/testing environment.
"""

import sys
import os
import sqlite3
from pathlib import Path

# Add backend directory to sys.path so we can import from app
backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from app.security import hash_password
from app.database import initialize_database

DB_PATH = backend_dir / "sheerwood.db"

def seed():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Drop tables that need schema evolution in local SQLite
    cur.execute("DROP TABLE IF EXISTS sessions")
    cur.execute("DROP TABLE IF EXISTS users")
    conn.commit()
    conn.close()

    # Re-initialize database with updated check constraints
    initialize_database()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Clean existing test data safely
    cur.execute("DELETE FROM sessions")
    cur.execute("DELETE FROM registration_fee_payments")
    cur.execute("DELETE FROM admission_documents")
    cur.execute("DELETE FROM consent_events")
    cur.execute("DELETE FROM new_admissions")
    cur.execute("DELETE FROM applications")
    cur.execute("DELETE FROM students")
    cur.execute("DELETE FROM teachers")
    cur.execute("DELETE FROM admins")
    cur.execute("DELETE FROM vendor_accounts")
    cur.execute("DELETE FROM users")
    cur.execute("DELETE FROM otp_codes")
    cur.execute("DELETE FROM email_otp_codes")

    print("Existing rows cleared and schema refreshed.")

    # 2. Seed Users
    # USR-PAR-01: Primary Parent
    cur.execute(
        "INSERT INTO users (id, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        (1, "qa.parent01@example.com", "QA Parent One", "parent", hash_password("QAtest@2027"))
    )
    # USR-PAR-02: Secondary Parent for IDOR / Isolation tests
    cur.execute(
        "INSERT INTO users (id, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        (2, "qa.parent02@example.com", "QA Parent Two", "parent", hash_password("QAtest@2027"))
    )
    # USR-ADM-01: Admin
    cur.execute(
        "INSERT INTO users (id, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        (3, "qa.admin01@example.com", "QA Principal Admin", "admin", hash_password("QAadmin@2027"))
    )
    # USR-TEA-01: Teacher
    cur.execute(
        "INSERT INTO users (id, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        (4, "qa.teacher01@example.com", "QA Teacher Sharma", "teacher", hash_password("QAteach@2027"))
    )
    # USR-STU-01: Student
    cur.execute(
        "INSERT INTO users (id, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        (5, "qa.student01@example.com", "QA Student Aarav", "student", hash_password("QAstud@2027"))
    )
    # USR-VND-01: Vendor user row
    cur.execute(
        "INSERT INTO users (id, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        (6, "qa.vendor01@example.com", "QA Partner Agency 1", "vendor", hash_password("QAvendor@2027"))
    )

    # 3. Seed Admins profile table
    cur.execute(
        "INSERT INTO admins (user_id, employee_code, full_name, email, phone, access_level, employment_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (3, "ADM-001", "QA Principal Admin", "qa.admin01@example.com", "+919876543210", "admin", "active")
    )

    # 4. Seed Teachers profile table
    cur.execute(
        "INSERT INTO teachers (user_id, employee_code, full_name, email, phone, subject, class_teacher, attendance_percent, employment_status, joined_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (4, "TCH-001", "QA Teacher Sharma", "qa.teacher01@example.com", "+919876543211", "Mathematics", "Grade 8-A", 96.5, "active", "2024-06-01")
    )

    # 5. Seed Students table
    cur.execute(
        "INSERT INTO students (student_code, full_name, class_section, attendance_percent, parent_name, parent_phone, roll_number, email, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("STU-2027-001", "QA Student Aarav", "Grade 8-A", 94.5, "QA Parent One", "+919876543201", "08A-14", "qa.student01@example.com", "active")
    )

    # 6. Seed Vendor accounts
    # USR-VND-01: Active Vendor
    cur.execute(
        "INSERT INTO vendor_accounts (vendor_id, full_name, email, cognito_username, referral_code, is_enabled) VALUES (?, ?, ?, ?, ?, ?)",
        ("QA-VEND-01", "QA Partner Agency 1", "qa.vendor01@example.com", "qa-vendor-01", "QA-VEND-01", 1)
    )
    # USR-VND-02: Second Vendor for isolation tests (and blocked state testing)
    cur.execute(
        "INSERT INTO vendor_accounts (vendor_id, full_name, email, cognito_username, referral_code, is_enabled) VALUES (?, ?, ?, ?, ?, ?)",
        ("QA-VEND-02", "QA Partner Agency 2", "qa.vendor02@example.com", "qa-vendor-02", "QA-VEND-02", 1)
    )

    # 7. Seed School settings baseline
    settings = [
        ("registration_fee", "1500"),
        ("academic_session", "2026-2027"),
        ("school_name", "Sheerwood College"),
        ("admissions_open", "1")
    ]
    for k, v in settings:
        cur.execute(
            "INSERT OR REPLACE INTO school_settings (setting_key, setting_value) VALUES (?, ?)",
            (k, v)
        )

    # 8. Seed a sample application for USR-PAR-01 to test dashboard viewing
    cur.execute(
        """INSERT INTO applications (
            application_number, student_name, parent_name, desired_class,
            status, documents_status, submitted_on, parent_id,
            registration_fee_status, vendor_id, referral_code, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            "APP-2027-QA001", "QA Test Child 001", "QA Parent One", "Grade 8",
            "submitted", "verified", "2026-11-15", 1,
            "paid", "QA-VEND-01", "QA-VEND-01", "2026-11-15T10:00:00"
        )
    )

    conn.commit()
    conn.close()
    print("Test data seeding completed successfully.")

if __name__ == "__main__":
    seed()
