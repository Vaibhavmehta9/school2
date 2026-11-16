"""
Database reset script for automated testing.
Restores the database either to the clean backup state or re-seeds baseline test data.
"""

import sys
import shutil
import sqlite3
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

DB_PATH = backend_dir / "sheerwood.db"
BACKUP_PATH = backend_dir / "sheerwood.db.qa_original_backup"

def reset():
    if BACKUP_PATH.exists():
        print(f"Restoring {DB_PATH} from {BACKUP_PATH}...")
        shutil.copy2(BACKUP_PATH, DB_PATH)
        print("Restored original database.")
    else:
        print("Backup file not found! Clearing tables manually...")
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        tables = [
            "sessions", "registration_fee_payments", "admission_documents",
            "consent_events", "new_admissions", "applications", "students",
            "teachers", "admins", "vendor_accounts", "users", "otp_codes", "email_otp_codes"
        ]
        for t in tables:
            cur.execute(f"DELETE FROM {t}")
        conn.commit()
        conn.close()
        print("Tables cleared.")

if __name__ == "__main__":
    reset()

