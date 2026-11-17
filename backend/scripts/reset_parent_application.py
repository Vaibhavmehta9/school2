"""
Script to reset a specific test parent's application or draft without affecting real applicants or data.
Usage:
    python backend/scripts/reset_parent_application.py <parent_email_or_application_number>
    python backend/scripts/reset_parent_application.py --demo-parents
"""

import os
import sys
import sqlite3
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

db_target = os.getenv("DATABASE_PATH") or str(backend_dir / "sheerwood.db")
db_path = Path(db_target)
if not db_path.is_absolute():
    db_path = backend_dir / db_path


def reset_application(target: str) -> None:
    if not db_path.exists():
        print(f"Database file not found at: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    target = target.strip()
    print(f"Connecting to database: {db_path}")

    # 1. Identify application(s)
    app_numbers = []
    if target == "--demo-parents":
        rows = cur.execute(
            "SELECT application_number FROM applications WHERE parent_email LIKE '%demo%' OR parent_email LIKE '%test%' OR parent_email LIKE '%review%'"
        ).fetchall()
        app_numbers = [r["application_number"] for r in rows]
    elif "@" in target:
        rows = cur.execute(
            "SELECT application_number FROM applications WHERE LOWER(parent_email) = LOWER(?)",
            (target,),
        ).fetchall()
        app_numbers = [r["application_number"] for r in rows]
    else:
        rows = cur.execute(
            "SELECT application_number FROM applications WHERE application_number = ?",
            (target,),
        ).fetchall()
        app_numbers = [r["application_number"] for r in rows]

    if not app_numbers:
        print(f"No applications found for target '{target}'.")
        conn.close()
        return

    for app_no in app_numbers:
        print(f"Resetting application: {app_no}")
        cur.execute("DELETE FROM admission_documents WHERE application_number = ?", (app_no,))
        cur.execute("DELETE FROM registration_fee_payments WHERE application_number = ?", (app_no,))
        cur.execute("DELETE FROM consent_events WHERE application_number = ?", (app_no,))
        cur.execute("DELETE FROM new_admissions WHERE application_number = ?", (app_no,))
        cur.execute("DELETE FROM applications WHERE application_number = ?", (app_no,))

    conn.commit()
    conn.close()
    print(f"Successfully reset {len(app_numbers)} application(s).")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/reset_parent_application.py <parent_email_or_application_number_or_--demo-parents>")
        sys.exit(1)
    reset_application(sys.argv[1])

