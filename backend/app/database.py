import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any


_raw_db_path = os.getenv("DATABASE_PATH")
if _raw_db_path:
    DATABASE_PATH = Path(_raw_db_path) if Path(_raw_db_path).is_absolute() else (Path(__file__).resolve().parents[1] / _raw_db_path)
else:
    DATABASE_PATH = Path(__file__).resolve().parents[1] / "sheerwood.db"


class PostgreSQLConnection:
    """Small compatibility layer for the existing SQLite-style query calls."""

    def __init__(self, database: Any):
        self._database = database

    def execute(self, statement: str, parameters: tuple[Any, ...] = ()):
        # The API was written with SQLite qmark placeholders; psycopg uses %s.
        # Application queries do not contain literal question marks, so this
        # keeps the query layer portable without interpolating any user input.
        return self._database.execute(statement.replace("?", "%s"), parameters)

    def commit(self) -> None:
        self._database.commit()

    def rollback(self) -> None:
        self._database.rollback()

    def close(self) -> None:
        self._database.close()


def postgres_configuration() -> dict[str, Any] | str | None:
    """Return PostgreSQL settings when RDS has been configured on the server.

    ``DATABASE_URL`` is useful for managed deployment platforms. The individual
    POSTGRES_* variables make it easier to configure an AWS RDS endpoint without
    putting an unescaped password into a URL. When neither is set, local SQLite
    remains available for development.
    """
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        if not database_url.startswith(("postgresql://", "postgres://")):
            raise RuntimeError("DATABASE_URL must use a postgresql:// or postgres:// URL.")
        return database_url

    host = os.getenv("POSTGRES_HOST", "").strip()
    if not host:
        return None

    required = {
        "POSTGRES_DATABASE": os.getenv("POSTGRES_DATABASE", "").strip(),
        "POSTGRES_USER": os.getenv("POSTGRES_USER", "").strip(),
        "POSTGRES_PASSWORD": os.getenv("POSTGRES_PASSWORD", "").strip(),
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"PostgreSQL is missing required server settings: {', '.join(missing)}.")

    settings = {
        "host": host,
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "dbname": required["POSTGRES_DATABASE"],
        "user": required["POSTGRES_USER"],
        "password": required["POSTGRES_PASSWORD"],
        "sslmode": os.getenv("POSTGRES_SSLMODE", "require").strip() or "require",
        "connect_timeout": int(os.getenv("POSTGRES_CONNECT_TIMEOUT", "5")),
    }
    root_certificate = os.getenv("POSTGRES_SSLROOTCERT", "").strip()
    if root_certificate:
        settings["sslrootcert"] = root_certificate
    return settings


@contextmanager
def connection():
    postgres_settings = postgres_configuration()
    if postgres_settings:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as error:
            raise RuntimeError("PostgreSQL support requires the 'psycopg' package. Install backend/requirements.txt.") from error

        database = psycopg.connect(postgres_settings, row_factory=dict_row) if isinstance(postgres_settings, str) else psycopg.connect(**postgres_settings, row_factory=dict_row)
        compatible_database = PostgreSQLConnection(database)
        try:
            yield compatible_database
            compatible_database.commit()
        except Exception:
            compatible_database.rollback()
            raise
        finally:
            compatible_database.close()
        return

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    database = sqlite3.connect(DATABASE_PATH)
    database.row_factory = sqlite3.Row
    try:
        yield database
        database.commit()
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()


def initialize_database() -> None:
    if postgres_configuration():
        initialize_postgres_database()
        return

    with connection() as database:
        database.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('parent', 'teacher', 'student', 'admin', 'admission', 'vendor')),
                password_hash TEXT NOT NULL,
                cognito_subject TEXT UNIQUE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_number TEXT NOT NULL UNIQUE,
                student_name TEXT NOT NULL,
                parent_name TEXT NOT NULL,
                desired_class TEXT NOT NULL,
                status TEXT NOT NULL,
                documents_status TEXT NOT NULL,
                submitted_on TEXT NOT NULL,
                class_section TEXT,
                section_allocation TEXT,
                verification_status TEXT NOT NULL DEFAULT 'pending',
                admin_remark TEXT NOT NULL DEFAULT '',
                reupload_reason TEXT NOT NULL DEFAULT '',
                verification_date TEXT,
                verified_by TEXT,
                approval_date TEXT,
                approved_by TEXT,
                approval_exception INTEGER NOT NULL DEFAULT 0,
                approval_exception_reason TEXT NOT NULL DEFAULT '',
                parent_id INTEGER,
                application_data TEXT NOT NULL DEFAULT '{}',
                documents_json TEXT NOT NULL DEFAULT '[]',
                registration_fee_status TEXT NOT NULL DEFAULT 'pending',
                registration_fee_paid_at TEXT,
                lead_source TEXT NOT NULL DEFAULT '',
                vendor_id TEXT NOT NULL DEFAULT '',
                campaign_id TEXT NOT NULL DEFAULT '',
                referral_code TEXT NOT NULL DEFAULT '',
                first_visit TEXT,
                submitted_at TEXT,
                FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS new_admissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_number TEXT NOT NULL UNIQUE,
                parent_id INTEGER,
                academic_session TEXT,
                application_date TEXT,
                class_applying_for TEXT,
                pen_number TEXT,
                previous_school TEXT,
                current_class TEXT,
                board TEXT,
                medium TEXT,
                student_name TEXT NOT NULL DEFAULT 'Application in progress',
                status TEXT NOT NULL DEFAULT 'draft',
                documents_status TEXT NOT NULL DEFAULT 'pending',
                verification_status TEXT NOT NULL DEFAULT 'pending',
                admin_remark TEXT NOT NULL DEFAULT '',
                reupload_reason TEXT NOT NULL DEFAULT '',
                verification_date TEXT,
                verified_by TEXT,
                approval_date TEXT,
                approved_by TEXT,
                approval_exception INTEGER NOT NULL DEFAULT 0,
                approval_exception_reason TEXT NOT NULL DEFAULT '',
                section_allocation TEXT,
                application_data TEXT NOT NULL DEFAULT '{}',
                documents_json TEXT NOT NULL DEFAULT '[]',
                registration_fee_status TEXT NOT NULL DEFAULT 'pending',
                registration_fee_paid_at TEXT,
                lead_source TEXT NOT NULL DEFAULT '',
                vendor_id TEXT NOT NULL DEFAULT '',
                campaign_id TEXT NOT NULL DEFAULT '',
                referral_code TEXT NOT NULL DEFAULT '',
                first_visit TEXT,
                submitted_at TEXT,
                submitted_on TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS registration_fee_payments (
                txnid TEXT PRIMARY KEY,
                application_number TEXT NOT NULL,
                parent_id INTEGER NOT NULL,
                amount TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                easebuzz_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                paid_at TEXT,
                FOREIGN KEY(parent_id) REFERENCES users(id)
            );
            CREATE INDEX IF NOT EXISTS registration_fee_payments_application_idx
            ON registration_fee_payments(application_number, created_at);
            CREATE UNIQUE INDEX IF NOT EXISTS registration_fee_payments_one_pending_idx
            ON registration_fee_payments(application_number) WHERE status = 'pending';

            CREATE TABLE IF NOT EXISTS admission_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_number TEXT NOT NULL,
                parent_id INTEGER NOT NULL,
                document_key TEXT NOT NULL,
                file_name TEXT NOT NULL,
                content_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                sha256 TEXT NOT NULL,
                file_content BLOB NOT NULL,
                status TEXT NOT NULL DEFAULT 'submitted',
                reason TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(application_number, document_key),
                FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_code TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                class_section TEXT NOT NULL,
                attendance_percent REAL NOT NULL,
                parent_name TEXT NOT NULL,
                parent_phone TEXT NOT NULL,
                admission_id INTEGER,
                roll_number TEXT,
                email TEXT,
                enrollment_status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(admission_id) REFERENCES new_admissions(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                employee_code TEXT UNIQUE,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT,
                subject TEXT,
                class_teacher TEXT,
                attendance_percent REAL NOT NULL DEFAULT 0,
                employment_status TEXT NOT NULL DEFAULT 'active',
                joined_on TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                employee_code TEXT UNIQUE,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT,
                access_level TEXT NOT NULL DEFAULT 'admin',
                employment_status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS otp_codes (
                phone_number TEXT PRIMARY KEY,
                code_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS email_otp_codes (
                email TEXT PRIMARY KEY,
                code_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS school_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS entrance_syllabus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject TEXT NOT NULL,
                details TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                active INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS vendor_accounts (
                vendor_id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                cognito_username TEXT NOT NULL UNIQUE,
                referral_code TEXT NOT NULL UNIQUE,
                is_enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS consent_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consent_id TEXT NOT NULL UNIQUE,
                application_number TEXT NOT NULL,
                parent_id INTEGER NOT NULL,
                parent_name TEXT NOT NULL,
                parent_mobile TEXT NOT NULL,
                parent_email TEXT NOT NULL,
                child_name TEXT NOT NULL,
                child_dob TEXT NOT NULL,
                relationship_to_child TEXT NOT NULL,
                otp_verified INTEGER NOT NULL CHECK(otp_verified IN (0, 1)),
                otp_verified_timestamp TEXT NOT NULL,
                consent_text_version TEXT NOT NULL,
                consent_given_timestamp TEXT NOT NULL,
                ip_address TEXT,
                purposes_consented TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('active', 'withdrawn')),
                related_consent_id TEXT,
                withdrawn_timestamp TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(parent_id) REFERENCES users(id)
            );

            CREATE INDEX IF NOT EXISTS consent_events_application_idx
            ON consent_events(application_number, parent_id, status, consent_given_timestamp);
            """
        )
        existing_columns = {row["name"] for row in database.execute("PRAGMA table_info(users)")}
        if "cognito_subject" not in existing_columns:
            database.execute("ALTER TABLE users ADD COLUMN cognito_subject TEXT")
            database.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_cognito_subject_idx ON users(cognito_subject) WHERE cognito_subject IS NOT NULL")

        user_table_sql = database.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").fetchone()
        if user_table_sql and "CHECK(role IN ('parent', 'teacher', 'admin'))" in user_table_sql["sql"]:
            database.execute("ALTER TABLE users RENAME TO users_legacy")
            database.execute(
                """
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL UNIQUE,
                    full_name TEXT NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('parent', 'teacher', 'student', 'admin', 'admission', 'vendor')),
                    password_hash TEXT NOT NULL,
                    cognito_subject TEXT UNIQUE,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            database.execute(
                """
                INSERT INTO users (id, email, full_name, role, password_hash, cognito_subject, created_at)
                SELECT id, email, full_name, role, password_hash, cognito_subject, created_at FROM users_legacy
                """
            )
            database.execute("DROP TABLE users_legacy")
            database.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_cognito_subject_idx ON users(cognito_subject) WHERE cognito_subject IS NOT NULL")
        application_columns = {row["name"] for row in database.execute("PRAGMA table_info(applications)")}
        if "application_data" not in application_columns:
            database.execute("ALTER TABLE applications ADD COLUMN application_data TEXT NOT NULL DEFAULT '{}'")
        if "documents_json" not in application_columns:
            database.execute("ALTER TABLE applications ADD COLUMN documents_json TEXT NOT NULL DEFAULT '[]'")
        for column, definition in (
            ("section_allocation", "TEXT"),
            ("verification_status", "TEXT NOT NULL DEFAULT 'pending'"),
            ("admin_remark", "TEXT NOT NULL DEFAULT ''"),
            ("reupload_reason", "TEXT NOT NULL DEFAULT ''"),
            ("verification_date", "TEXT"),
            ("verified_by", "TEXT"),
            ("approval_date", "TEXT"),
            ("approved_by", "TEXT"),
            ("approval_exception", "INTEGER NOT NULL DEFAULT 0"),
            ("approval_exception_reason", "TEXT NOT NULL DEFAULT ''"),
            ("registration_fee_status", "TEXT NOT NULL DEFAULT 'pending'"),
            ("registration_fee_paid_at", "TEXT"),
            ("lead_source", "TEXT NOT NULL DEFAULT ''"),
            ("vendor_id", "TEXT NOT NULL DEFAULT ''"),
            ("campaign_id", "TEXT NOT NULL DEFAULT ''"),
            ("referral_code", "TEXT NOT NULL DEFAULT ''"),
            ("first_visit", "TEXT"),
            ("submitted_at", "TEXT"),
        ):
            if column not in application_columns:
                database.execute(f"ALTER TABLE applications ADD COLUMN {column} {definition}")
        consent_columns = {row["name"] for row in database.execute("PRAGMA table_info(consent_events)")}
        for column, definition in (
            ("related_consent_id", "TEXT"),
            ("withdrawn_timestamp", "TEXT"),
        ):
            if column not in consent_columns:
                database.execute(f"ALTER TABLE consent_events ADD COLUMN {column} {definition}")
        admission_columns = {row["name"] for row in database.execute("PRAGMA table_info(new_admissions)")}
        for column, definition in (
            ("verification_status", "TEXT NOT NULL DEFAULT 'pending'"),
            ("admin_remark", "TEXT NOT NULL DEFAULT ''"),
            ("reupload_reason", "TEXT NOT NULL DEFAULT ''"),
            ("verification_date", "TEXT"),
            ("verified_by", "TEXT"),
            ("approval_date", "TEXT"),
            ("approved_by", "TEXT"),
            ("approval_exception", "INTEGER NOT NULL DEFAULT 0"),
            ("approval_exception_reason", "TEXT NOT NULL DEFAULT ''"),
            ("section_allocation", "TEXT"),
            ("registration_fee_status", "TEXT NOT NULL DEFAULT 'pending'"),
            ("registration_fee_paid_at", "TEXT"),
            ("lead_source", "TEXT NOT NULL DEFAULT ''"),
            ("vendor_id", "TEXT NOT NULL DEFAULT ''"),
            ("campaign_id", "TEXT NOT NULL DEFAULT ''"),
            ("referral_code", "TEXT NOT NULL DEFAULT ''"),
            ("first_visit", "TEXT"),
            ("submitted_at", "TEXT"),
        ):
            if column not in admission_columns:
                database.execute(f"ALTER TABLE new_admissions ADD COLUMN {column} {definition}")
        student_columns = {row["name"] for row in database.execute("PRAGMA table_info(students)")}
        for column, definition in (
            ("admission_id", "INTEGER"),
            ("roll_number", "TEXT"),
            ("email", "TEXT"),
            ("enrollment_status", "TEXT NOT NULL DEFAULT 'active'"),
            ("created_at", "TEXT"),
            ("updated_at", "TEXT"),
        ):
            if column not in student_columns:
                database.execute(f"ALTER TABLE students ADD COLUMN {column} {definition}")
        database.execute("CREATE INDEX IF NOT EXISTS new_admissions_parent_status_idx ON new_admissions(parent_id, status)")
        database.execute("CREATE INDEX IF NOT EXISTS admission_documents_parent_idx ON admission_documents(parent_id, application_number)")
        database.execute("CREATE INDEX IF NOT EXISTS students_class_section_idx ON students(class_section)")
        database.execute("CREATE INDEX IF NOT EXISTS teachers_status_idx ON teachers(employment_status)")
        database.execute("CREATE INDEX IF NOT EXISTS admins_status_idx ON admins(employment_status)")

        # Create media_items table for Tour Chapters & Events CMS
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS media_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL CHECK(kind IN ('tour', 'event')),
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                summary TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT '',
                chapter_order INTEGER,
                start_at TEXT,
                end_at TEXT,
                all_day INTEGER NOT NULL DEFAULT 0,
                location TEXT NOT NULL DEFAULT '',
                video_provider TEXT CHECK(video_provider IN ('youtube', 'vimeo', 'none')),
                video_id TEXT,
                video_url TEXT,
                video_embed_url TEXT,
                video_poster_url TEXT,
                cover_image_path TEXT,
                duration_seconds INTEGER,
                link_url TEXT,
                link_label TEXT,
                status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
                featured INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                demo INTEGER NOT NULL DEFAULT 0,
                source_credit TEXT NOT NULL DEFAULT '',
                has_students INTEGER NOT NULL DEFAULT 0,
                consent_confirmed INTEGER NOT NULL DEFAULT 0,
                created_by TEXT NOT NULL DEFAULT 'admin',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_by TEXT NOT NULL DEFAULT 'admin',
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted_at TEXT
            );
            """
        )
        database.execute("CREATE INDEX IF NOT EXISTS media_items_kind_status_idx ON media_items(kind, status, sort_order)")
        database.execute("CREATE INDEX IF NOT EXISTS media_items_slug_idx ON media_items(slug)")

        # Seed initial media items if table is empty
        seed_media_items(database)


def initialize_postgres_database() -> None:
    """Create and upgrade the schema used by the FastAPI API on PostgreSQL."""
    statements = (
        """
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('parent', 'teacher', 'student', 'admin', 'admission')),
            password_hash TEXT NOT NULL,
            cognito_subject TEXT UNIQUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            expires_at TEXT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS applications (
            id BIGSERIAL PRIMARY KEY,
            application_number TEXT NOT NULL UNIQUE,
            student_name TEXT NOT NULL,
            parent_name TEXT NOT NULL,
            desired_class TEXT NOT NULL,
            status TEXT NOT NULL,
            documents_status TEXT NOT NULL,
            submitted_on TEXT NOT NULL,
            class_section TEXT,
            section_allocation TEXT,
            verification_status TEXT NOT NULL DEFAULT 'pending',
            admin_remark TEXT NOT NULL DEFAULT '',
            reupload_reason TEXT NOT NULL DEFAULT '',
            verification_date TEXT,
            verified_by TEXT,
            approval_date TEXT,
            approved_by TEXT,
            approval_exception INTEGER NOT NULL DEFAULT 0,
            approval_exception_reason TEXT NOT NULL DEFAULT '',
            parent_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
            application_data TEXT NOT NULL DEFAULT '{}',
            documents_json TEXT NOT NULL DEFAULT '[]',
            registration_fee_status TEXT NOT NULL DEFAULT 'pending',
            registration_fee_paid_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS new_admissions (
            id BIGSERIAL PRIMARY KEY,
            application_number TEXT NOT NULL UNIQUE,
            parent_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
            academic_session TEXT,
            application_date TEXT,
            class_applying_for TEXT,
            pen_number TEXT,
            previous_school TEXT,
            current_class TEXT,
            board TEXT,
            medium TEXT,
            student_name TEXT NOT NULL DEFAULT 'Application in progress',
            status TEXT NOT NULL DEFAULT 'draft',
            documents_status TEXT NOT NULL DEFAULT 'pending',
            verification_status TEXT NOT NULL DEFAULT 'pending',
            admin_remark TEXT NOT NULL DEFAULT '',
            reupload_reason TEXT NOT NULL DEFAULT '',
            verification_date TEXT,
            verified_by TEXT,
            approval_date TEXT,
            approved_by TEXT,
            approval_exception INTEGER NOT NULL DEFAULT 0,
            approval_exception_reason TEXT NOT NULL DEFAULT '',
            section_allocation TEXT,
            application_data TEXT NOT NULL DEFAULT '{}',
            documents_json TEXT NOT NULL DEFAULT '[]',
            registration_fee_status TEXT NOT NULL DEFAULT 'pending',
            registration_fee_paid_at TEXT,
            submitted_on TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS registration_fee_payments (
            txnid TEXT PRIMARY KEY,
            application_number TEXT NOT NULL,
            parent_id BIGINT NOT NULL REFERENCES users(id),
            amount TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            easebuzz_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            paid_at TEXT
        )
        """,
        "CREATE INDEX IF NOT EXISTS registration_fee_payments_application_idx ON registration_fee_payments(application_number, created_at)",
        "CREATE UNIQUE INDEX IF NOT EXISTS registration_fee_payments_one_pending_idx ON registration_fee_payments(application_number) WHERE status = 'pending'",
        """
        CREATE TABLE IF NOT EXISTS admission_documents (
            id BIGSERIAL PRIMARY KEY,
            application_number TEXT NOT NULL,
            parent_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            document_key TEXT NOT NULL,
            file_name TEXT NOT NULL,
            content_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            sha256 TEXT NOT NULL,
            file_content BYTEA NOT NULL,
            status TEXT NOT NULL DEFAULT 'submitted',
            reason TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            UNIQUE(application_number, document_key)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS students (
            id BIGSERIAL PRIMARY KEY,
            student_code TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            class_section TEXT NOT NULL,
            attendance_percent DOUBLE PRECISION NOT NULL,
            parent_name TEXT NOT NULL,
            parent_phone TEXT NOT NULL,
            admission_id BIGINT REFERENCES new_admissions(id) ON DELETE SET NULL,
            roll_number TEXT,
            email TEXT,
            enrollment_status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS teachers (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
            employee_code TEXT UNIQUE,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            subject TEXT,
            class_teacher TEXT,
            attendance_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
            employment_status TEXT NOT NULL DEFAULT 'active',
            joined_on TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS admins (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
            employee_code TEXT UNIQUE,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            access_level TEXT NOT NULL DEFAULT 'admin',
            employment_status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS otp_codes (
            phone_number TEXT PRIMARY KEY,
            code_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS email_otp_codes (
            email TEXT PRIMARY KEY,
            code_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS school_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS entrance_syllabus (
            id BIGSERIAL PRIMARY KEY,
            subject TEXT NOT NULL,
            details TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS vendor_accounts (
            vendor_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            cognito_username TEXT NOT NULL UNIQUE,
            referral_code TEXT NOT NULL UNIQUE,
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS consent_events (
            id BIGSERIAL PRIMARY KEY,
            consent_id TEXT NOT NULL UNIQUE,
            application_number TEXT NOT NULL,
            parent_id BIGINT NOT NULL REFERENCES users(id),
            parent_name TEXT NOT NULL,
            parent_mobile TEXT NOT NULL,
            parent_email TEXT NOT NULL,
            child_name TEXT NOT NULL,
            child_dob TEXT NOT NULL,
            relationship_to_child TEXT NOT NULL,
            otp_verified BOOLEAN NOT NULL,
            otp_verified_timestamp TEXT NOT NULL,
            consent_text_version TEXT NOT NULL,
            consent_given_timestamp TEXT NOT NULL,
            ip_address TEXT,
            purposes_consented TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('active', 'withdrawn')),
            related_consent_id TEXT,
            withdrawn_timestamp TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
        )
        """,
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_subject TEXT",
        "CREATE UNIQUE INDEX IF NOT EXISTS users_cognito_subject_idx ON users(cognito_subject) WHERE cognito_subject IS NOT NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_data TEXT NOT NULL DEFAULT '{}'",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS documents_json TEXT NOT NULL DEFAULT '[]'",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS section_allocation TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS admin_remark TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS reupload_reason TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS verification_date TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS verified_by TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS approval_date TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS approved_by TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS approval_exception INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS approval_exception_reason TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS registration_fee_status TEXT NOT NULL DEFAULT 'pending'",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS registration_fee_paid_at TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS lead_source TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS vendor_id TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS campaign_id TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS referral_code TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS first_visit TEXT",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_at TEXT",
        "ALTER TABLE consent_events ADD COLUMN IF NOT EXISTS related_consent_id TEXT",
        "ALTER TABLE consent_events ADD COLUMN IF NOT EXISTS withdrawn_timestamp TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS admin_remark TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS reupload_reason TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS verification_date TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS verified_by TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS approval_date TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS approved_by TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS approval_exception INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS approval_exception_reason TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS section_allocation TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS registration_fee_status TEXT NOT NULL DEFAULT 'pending'",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS registration_fee_paid_at TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS lead_source TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS vendor_id TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS campaign_id TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS referral_code TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS first_visit TEXT",
        "ALTER TABLE new_admissions ADD COLUMN IF NOT EXISTS submitted_at TEXT",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_id BIGINT REFERENCES new_admissions(id) ON DELETE SET NULL",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number TEXT",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'active'",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text",
        "ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text",
        "CREATE INDEX IF NOT EXISTS consent_events_application_idx ON consent_events(application_number, parent_id, status, consent_given_timestamp)",
        "CREATE INDEX IF NOT EXISTS new_admissions_parent_status_idx ON new_admissions(parent_id, status)",
        "CREATE INDEX IF NOT EXISTS admission_documents_parent_idx ON admission_documents(parent_id, application_number)",
        "CREATE INDEX IF NOT EXISTS students_class_section_idx ON students(class_section)",
        "CREATE INDEX IF NOT EXISTS teachers_status_idx ON teachers(employment_status)",
        "CREATE INDEX IF NOT EXISTS admins_status_idx ON admins(employment_status)",
        "INSERT INTO school_settings (setting_key, setting_value) VALUES ('registration_fee_amount', '1500') ON CONFLICT(setting_key) DO NOTHING",
        "INSERT INTO school_settings (setting_key, setting_value) VALUES ('registration_fee_amount', '1500') ON CONFLICT(setting_key) DO NOTHING",
        """
        CREATE TABLE IF NOT EXISTS media_items (
            id BIGSERIAL PRIMARY KEY,
            kind TEXT NOT NULL CHECK(kind IN ('tour', 'event')),
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            summary TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT '',
            chapter_order INTEGER,
            start_at TEXT,
            end_at TEXT,
            all_day BOOLEAN NOT NULL DEFAULT FALSE,
            location TEXT NOT NULL DEFAULT '',
            video_provider TEXT CHECK(video_provider IN ('youtube', 'vimeo', 'none')),
            video_id TEXT,
            video_url TEXT,
            video_embed_url TEXT,
            video_poster_url TEXT,
            cover_image_path TEXT,
            duration_seconds INTEGER,
            link_url TEXT,
            link_label TEXT,
            status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
            featured BOOLEAN NOT NULL DEFAULT FALSE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            demo BOOLEAN NOT NULL DEFAULT FALSE,
            source_credit TEXT NOT NULL DEFAULT '',
            has_students BOOLEAN NOT NULL DEFAULT FALSE,
            consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
            created_by TEXT NOT NULL DEFAULT 'admin',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            updated_by TEXT NOT NULL DEFAULT 'admin',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
            deleted_at TEXT
        )
        """,
        "CREATE INDEX IF NOT EXISTS media_items_kind_status_idx ON media_items(kind, status, sort_order)",
        "CREATE INDEX IF NOT EXISTS media_items_slug_idx ON media_items(slug)",
    )
    with connection() as database:
        for statement in statements:
            database.execute(statement)
        seed_media_items(database)


def seed_media_items(database: Any) -> None:
    """Idempotently seed the initial 4 virtual tour chapters and 4 events if table is empty."""
    row = database.execute("SELECT COUNT(*) as count FROM media_items").fetchone()
    if row and row["count"] > 0:
        return

    items = [
        # Virtual Tour Chapters (Official Channel: @sherwoodcollegenainital5366)
        {
            "kind": "tour",
            "title": "Founders' PT Display & Campus Parade",
            "slug": "founders-pt-display-campus-parade",
            "summary": "Watch the prestigious Founders' Day Physical Training display, student marching precision, and ceremonial parade on the main pavilion.",
            "description": "Physical training, marching precision, and ceremonial discipline on the Sherwood College pavilion during the annual Founders' Day celebration. Established in 1869 in Nainital, Sherwood continues its proud heritage of building resilience and character.",
            "category": "Campus & Heritage",
            "chapter_order": 1,
            "start_at": None,
            "end_at": None,
            "all_day": 0,
            "location": "Main Sports Pavilion, Sherwood College",
            "video_provider": "youtube",
            "video_id": "AVOnUf5BTrc",
            "video_url": "https://www.youtube.com/watch?v=AVOnUf5BTrc",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/AVOnUf5BTrc",
            "video_poster_url": "https://i.ytimg.com/vi/AVOnUf5BTrc/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 4732,
            "link_url": "/#admissions",
            "link_label": "Schedule a Campus Visit",
            "status": "published",
            "featured": 1,
            "sort_order": 1,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        {
            "kind": "tour",
            "title": "Academic Excellence & ICSE Batches",
            "slug": "academic-excellence-icse-batches",
            "summary": "Celebrating student academic excellence, examination focus, and comprehensive ICSE learning at Sherwood College.",
            "description": "An overview of academic life, examination rigour, and student excellence across ICSE batches at Sherwood College, Nainital. State-of-the-art facilities and dedicated faculty prepare students for board examinations and higher education.",
            "category": "Academics",
            "chapter_order": 2,
            "start_at": None,
            "end_at": None,
            "all_day": 0,
            "location": "Academic Blocks & Examination Halls",
            "video_provider": "youtube",
            "video_id": "DH4vvUDc9CY",
            "video_url": "https://www.youtube.com/watch?v=DH4vvUDc9CY",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/DH4vvUDc9CY",
            "video_poster_url": "https://i.ytimg.com/vi/DH4vvUDc9CY/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 168,
            "link_url": "/#admissions",
            "link_label": "View Academic Curriculum",
            "status": "published",
            "featured": 0,
            "sort_order": 2,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        {
            "kind": "tour",
            "title": "Senior Choir & College Chapel Tradition",
            "slug": "senior-choir-chapel-tradition",
            "summary": "The timeless choral and liturgical heritage of the historic Sherwood College Chapel performed by the Senior Choir.",
            "description": "Experience the historic acoustic beauty and sacred choral traditions of the Sherwood College Chapel with the Senior Choir. Music and chapel worship remain central pillars of the school's heritage since 1869.",
            "category": "Chapel & Music",
            "chapter_order": 3,
            "start_at": None,
            "end_at": None,
            "all_day": 0,
            "location": "Sherwood College Chapel",
            "video_provider": "youtube",
            "video_id": "eQInMXZn9a8",
            "video_url": "https://www.youtube.com/watch?v=eQInMXZn9a8",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/eQInMXZn9a8",
            "video_poster_url": "https://i.ytimg.com/vi/eQInMXZn9a8/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 2382,
            "link_url": "/#admissions",
            "link_label": "Explore Chapel Heritage",
            "status": "published",
            "featured": 0,
            "sort_order": 3,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        {
            "kind": "tour",
            "title": "Soccer Season & Athletics Pavilion",
            "slug": "soccer-season-athletics-pavilion",
            "summary": "Inter-house soccer action, spirited competition, and sporting camaraderie on the historic Sherwood pavilion field.",
            "description": "Highlights from the annual soccer season at Sherwood College, showcasing student athleticism, camaraderie, and team spirit in the pine-scented hills of Nainital.",
            "category": "Sports & Athletics",
            "chapter_order": 4,
            "start_at": None,
            "end_at": None,
            "all_day": 0,
            "location": "Main Sports Pavilion, Sherwood College",
            "video_provider": "youtube",
            "video_id": "d6YuaNV903Y",
            "video_url": "https://www.youtube.com/watch?v=d6YuaNV903Y",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/d6YuaNV903Y",
            "video_poster_url": "https://i.ytimg.com/vi/d6YuaNV903Y/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 78,
            "link_url": "/#admissions",
            "link_label": "Explore Athletics",
            "status": "published",
            "featured": 0,
            "sort_order": 4,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        # Campus Events (Official Channel: @sherwoodcollegenainital5366)
        {
            "kind": "event",
            "title": "Founders' Day Production: 'MACBETH'",
            "slug": "founders-day-production-macbeth",
            "summary": "Sherwood senior students present William Shakespeare's Macbeth on the historic Milman Hall auditorium stage.",
            "description": "Full dramatic production of Shakespeare's Macbeth performed by senior students for the annual Founder's Day theatre tradition in Milman Hall, judged and applauded by alumni and distinguished guests.",
            "category": "Theatre & Drama",
            "chapter_order": None,
            "start_at": "2026-10-15T18:00:00+05:30",
            "end_at": "2026-10-15T20:30:00+05:30",
            "all_day": 0,
            "location": "Milman Hall Auditorium, Sherwood College",
            "video_provider": "youtube",
            "video_id": "7I4qHmhjK9Q",
            "video_url": "https://www.youtube.com/watch?v=7I4qHmhjK9Q",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/7I4qHmhjK9Q",
            "video_poster_url": "https://i.ytimg.com/vi/7I4qHmhjK9Q/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 4594,
            "link_url": "/#admissions",
            "link_label": "Founders' Highlights",
            "status": "published",
            "featured": 1,
            "sort_order": 1,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        {
            "kind": "event",
            "title": "Sherwood Soccer League (SSL) Final Match",
            "slug": "sherwood-soccer-league-ssl-final",
            "summary": "Championship final of the inter-house Sherwood Soccer League tournament on the college sports field.",
            "description": "The climactic final match of the Sherwood Soccer League (SSL) with houses competing fiercely for the coveted inter-house championship trophy.",
            "category": "Sports",
            "chapter_order": None,
            "start_at": "2026-11-10T14:30:00+05:30",
            "end_at": "2026-11-10T17:00:00+05:30",
            "all_day": 0,
            "location": "Main Sports Pavilion, Sherwood College",
            "video_provider": "youtube",
            "video_id": "3Jp9lAHx4jM",
            "video_url": "https://www.youtube.com/watch?v=3Jp9lAHx4jM",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/3Jp9lAHx4jM",
            "video_poster_url": "https://i.ytimg.com/vi/3Jp9lAHx4jM/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 2043,
            "link_url": "/#admissions",
            "link_label": "Tournament Details",
            "status": "published",
            "featured": 1,
            "sort_order": 2,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        {
            "kind": "event",
            "title": "Horsman Wing Founders' Play",
            "slug": "horsman-wing-founders-play",
            "summary": "Junior school dramatic showcase performed by junior students of the Horsman Wing in Milman Hall.",
            "description": "The annual Founders' theatrical presentation by junior school boys of the Horsman Wing, celebrating drama, elocution, and stage presence.",
            "category": "Junior School",
            "chapter_order": None,
            "start_at": "2026-10-18T17:00:00+05:30",
            "end_at": "2026-10-18T19:00:00+05:30",
            "all_day": 0,
            "location": "Milman Hall, Sherwood College",
            "video_provider": "youtube",
            "video_id": "TvTiEYHxAx8",
            "video_url": "https://www.youtube.com/watch?v=TvTiEYHxAx8",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/TvTiEYHxAx8",
            "video_poster_url": "https://i.ytimg.com/vi/TvTiEYHxAx8/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 3859,
            "link_url": "/#admissions",
            "link_label": "Junior School Drama",
            "status": "published",
            "featured": 0,
            "sort_order": 3,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
        {
            "kind": "event",
            "title": "Founders' Western Music Concert",
            "slug": "founders-western-music-concert",
            "summary": "Annual orchestral, instrumental, and ensemble musical concert by Sherwoodian musicians during Founders' Week.",
            "description": "A grand evening of classical, jazz, and contemporary western music performed by student ensembles, brass sections, and vocalists in Milman Hall.",
            "category": "Music & Performing Arts",
            "chapter_order": None,
            "start_at": "2026-10-22T18:30:00+05:30",
            "end_at": "2026-10-22T21:00:00+05:30",
            "all_day": 0,
            "location": "Milman Hall, Sherwood College",
            "video_provider": "youtube",
            "video_id": "RPynPsX0MrU",
            "video_url": "https://www.youtube.com/watch?v=RPynPsX0MrU",
            "video_embed_url": "https://www.youtube-nocookie.com/embed/RPynPsX0MrU",
            "video_poster_url": "https://i.ytimg.com/vi/RPynPsX0MrU/hqdefault.jpg",
            "cover_image_path": None,
            "duration_seconds": 2870,
            "link_url": "/#admissions",
            "link_label": "Concert Program",
            "status": "published",
            "featured": 0,
            "sort_order": 4,
            "demo": 0,
            "source_credit": "Sherwood College, Nainital (Official Channel)",
            "has_students": 1,
            "consent_confirmed": 1,
        },
    ]

    for item in items:
        database.execute(
            """
            INSERT INTO media_items (
                kind, title, slug, summary, description, category, chapter_order,
                start_at, end_at, all_day, location, video_provider, video_id,
                video_url, video_embed_url, video_poster_url, cover_image_path,
                duration_seconds, link_url, link_label, status, featured, sort_order,
                demo, source_credit, has_students, consent_confirmed, created_by, updated_by
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, 'system', 'system'
            )
            """,
            (
                item["kind"], item["title"], item["slug"], item["summary"], item["description"], item["category"], item["chapter_order"],
                item["start_at"], item["end_at"], item["all_day"], item["location"], item["video_provider"], item["video_id"],
                item["video_url"], item["video_embed_url"], item["video_poster_url"], item["cover_image_path"],
                item["duration_seconds"], item["link_url"], item["link_label"], item["status"], item["featured"], item["sort_order"],
                item["demo"], item["source_credit"], item["has_students"], item["consent_confirmed"]
            )
        )
