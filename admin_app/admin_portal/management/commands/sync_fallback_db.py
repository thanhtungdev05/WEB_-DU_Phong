"""
Django Management Command: sync_fallback_db
Đồng bộ Schema và Dữ liệu từ Database Chính (DATABASE_URL) sang Database Dự Phòng (FALLBACK_DATABASE_URL).

Usage:
    python manage.py sync_fallback_db
    python manage.py sync_fallback_db --dry-run
    python manage.py sync_fallback_db --schema-only
    python manage.py sync_fallback_db --data-only
"""
from __future__ import annotations

import hashlib
import os
import pathlib
import sys
import time
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from django.core.management.base import BaseCommand, CommandError
import psycopg
from psycopg.rows import dict_row

ROOT_DIR = pathlib.Path(__file__).resolve().parents[4]
MIGRATIONS_DIR = ROOT_DIR / "api" / "migrations"

# Thứ tự bảng cần đồng bộ để đảm bảo Foreign Key constraints
SYNC_TABLES = [
    "regions",
    "org_units",
    "device_catalog",
    "lab_catalog",
    "roles",
    "users",
    "curricula",
    "curriculum_labs",
    "training_classes",
    "class_enrollments",
    "class_lab_assignments",
    "lab_assignments",
    "timer_sessions",
    "timer_session_assignment_links",
    "login_logs",
]


class Command(BaseCommand):
    help = "Đồng bộ schema và dữ liệu từ Primary DB sang Fallback DB (Neon)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chỉ kiểm tra và báo cáo số dòng sẽ đồng bộ, không ghi vào Fallback DB.",
        )
        parser.add_argument(
            "--schema-only",
            action="store_true",
            help="Chỉ chạy migrations để cập nhật schema/bảng/view trên Fallback DB.",
        )
        parser.add_argument(
            "--data-only",
            action="store_true",
            help="Chỉ đồng bộ dữ liệu các bảng, bỏ qua bước chạy migrations.",
        )

    def handle(self, *args: Any, **options: Any):
        primary_url = os.environ.get("DATABASE_URL", "").strip()
        fallback_url = os.environ.get("FALLBACK_DATABASE_URL", "").strip()
        dry_run = options["dry_run"]
        schema_only = options["schema_only"]
        data_only = options["data_only"]

        if not primary_url:
            raise CommandError("DATABASE_URL (Primary DB) chưa được cấu hình trong môi trường.")
        if not fallback_url:
            raise CommandError("FALLBACK_DATABASE_URL (Fallback DB) chưa được cấu hình trong môi trường.")

        self.stdout.write(self.style.MIGRATE_HEADING("=== BẮT ĐẦU ĐỒNG BỘ NEON DATABASE DỰ PHÒNG ==="))
        if dry_run:
            self.stdout.write(self.style.WARNING("Chế độ DRY-RUN: Không có dữ liệu nào được ghi."))

        # ── 1. Chạy Migrations trên Fallback DB ───────────────────────
        if not data_only:
            self.stdout.write("\n[1/2] Đang kiểm tra và cập nhật Schema trên Fallback DB...")
            self._apply_migrations_to_fallback(fallback_url, dry_run)
        else:
            self.stdout.write("\n[1/2] Bỏ qua Schema migrations (--data-only).")

        # ── 2. Đồng bộ Dữ liệu từ Primary sang Fallback ───────────────
        if not schema_only:
            self.stdout.write("\n[2/2] Đang đồng bộ dữ liệu các bảng từ Primary sang Fallback DB...")
            self._sync_tables(primary_url, fallback_url, dry_run)
        else:
            self.stdout.write("\n[2/2] Bỏ qua Data sync (--schema-only).")

        self.stdout.write(self.style.SUCCESS("\n=== HOÀN TẤT ĐỒNG BỘ THÀNH CÔNG ==="))

    def _apply_migrations_to_fallback(self, fallback_url: str, dry_run: bool):
        if not MIGRATIONS_DIR.exists():
            self.stdout.write(self.style.WARNING(f"Không tìm thấy thư mục migrations: {MIGRATIONS_DIR}"))
            return

        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        if not migration_files:
            self.stdout.write("Không có file SQL migration nào.")
            return

        with psycopg.connect(fallback_url, autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        version TEXT PRIMARY KEY,
                        checksum CHAR(64) NOT NULL,
                        execution_ms INTEGER NOT NULL,
                        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute("SELECT version FROM schema_migrations")
                applied_versions = {row[0] for row in cur.fetchall()}

                pending = [f for f in migration_files if f.stem not in applied_versions]
                self.stdout.write(f"  • Tổng số migration: {len(migration_files)}, Đã áp dụng: {len(applied_versions)}, Chưa chạy: {len(pending)}")

                if dry_run:
                    for f in pending:
                        self.stdout.write(f"    [DRY-RUN] Sẽ chạy migration: {f.name}")
                    return

                for f in pending:
                    version = f.stem
                    sql_content = f.read_text(encoding="utf-8")
                    checksum = hashlib.sha256(sql_content.encode("utf-8")).hexdigest()

                    t0 = time.perf_counter()
                    cur.execute(sql_content)
                    execution_ms = int((time.perf_counter() - t0) * 1000)

                    cur.execute(
                        """
                        INSERT INTO schema_migrations (version, checksum, execution_ms)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (version) DO UPDATE
                        SET checksum = EXCLUDED.checksum, execution_ms = EXCLUDED.execution_ms
                        """,
                        (version, checksum, execution_ms),
                    )
                    self.stdout.write(self.style.SUCCESS(f"    ✓ Đã chạy {f.name} ({execution_ms} ms)"))

    def _sync_tables(self, primary_url: str, fallback_url: str, dry_run: bool):
        with psycopg.connect(primary_url, row_factory=dict_row) as conn_pri, \
             psycopg.connect(fallback_url, autocommit=True) as conn_fb:

            with conn_pri.cursor() as cur_pri, conn_fb.cursor() as cur_fb:
                # Tạm thời tắt trigger/FK check trên Fallback DB để nạp dữ liệu nhanh
                if not dry_run:
                    cur_fb.execute("SET session_replication_role = 'replica';")

                try:
                    for table_name in SYNC_TABLES:
                        # Kiểm tra xem bảng có tồn tại trên Primary DB không
                        cur_pri.execute(
                            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = %s",
                            (table_name,),
                        )
                        if not cur_pri.fetchone():
                            continue

                        cur_pri.execute(f"SELECT * FROM {table_name}")
                        rows = cur_pri.fetchall()
                        row_count = len(rows)

                        if row_count == 0:
                            self.stdout.write(f"  • Bảng '{table_name}': 0 dòng (trống)")
                            continue

                        self.stdout.write(f"  • Bảng '{table_name}': {row_count} dòng")

                        if dry_run:
                            continue

                        # Lấy danh sách cột
                        columns = list(rows[0].keys())
                        cols_str = ", ".join(f'"{c}"' for c in columns)
                        placeholders = ", ".join(["%s"] * len(columns))

                        # Tìm Primary Key của bảng
                        cur_fb.execute(
                            """
                            SELECT kcu.column_name
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                              ON tc.constraint_name = kcu.constraint_name
                             AND tc.table_schema = kcu.table_schema
                            WHERE tc.constraint_type = 'PRIMARY KEY'
                              AND tc.table_schema = 'public'
                              AND tc.table_name = %s
                            ORDER BY kcu.ordinal_position
                            """,
                            (table_name,),
                        )
                        pk_rows = cur_fb.fetchall()
                        pk_columns = [r[0] for r in pk_rows]

                        if pk_columns:
                            pk_str = ", ".join(f'"{pk}"' for pk in pk_columns)
                            update_cols = [c for c in columns if c not in pk_columns]
                            if update_cols:
                                update_clause = ", ".join(f'"{c}" = EXCLUDED."{c}"' for c in update_cols)
                                sql_insert = f"""
                                    INSERT INTO {table_name} ({cols_str})
                                    VALUES ({placeholders})
                                    ON CONFLICT ({pk_str}) DO UPDATE SET {update_clause}
                                """
                            else:
                                sql_insert = f"""
                                    INSERT INTO {table_name} ({cols_str})
                                    VALUES ({placeholders})
                                    ON CONFLICT ({pk_str}) DO NOTHING
                                """
                        else:
                            # Nếu không có PK, truncate và insert lại
                            cur_fb.execute(f"TRUNCATE TABLE {table_name} CASCADE;")
                            sql_insert = f"INSERT INTO {table_name} ({cols_str}) VALUES ({placeholders})"

                        batch_data = [[row[col] for col in columns] for row in rows]
                        cur_fb.executemany(sql_insert, batch_data)
                        self.stdout.write(self.style.SUCCESS(f"    ✓ Đã đồng bộ {row_count} dòng vào '{table_name}'"))

                finally:
                    if not dry_run:
                        cur_fb.execute("SET session_replication_role = 'origin';")
