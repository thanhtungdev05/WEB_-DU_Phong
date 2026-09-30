"""
Django management command: cleanup_db
Xoá session hết hạn, chạy VACUUM, và báo cáo storage Neon.

Usage:
    python manage.py cleanup_db                  # Xoá sessions + VACUUM + report
    python manage.py cleanup_db --dry-run        # Chỉ hiển thị, không xoá
    python manage.py cleanup_db --report-only    # Chỉ báo cáo storage
    python manage.py cleanup_db --vacuum         # Chạy VACUUM ANALYZE thêm

Chạy định kỳ (khuyến nghị): mỗi 6 giờ qua scheduler trong run_all.py
"""
from __future__ import annotations

import time
from django.core.management.base import BaseCommand
from django.db import connection


# Ngưỡng cảnh báo (MB) — Neon Free limit: 512 MB
NEON_FREE_LIMIT_MB = 512
WARN_THRESHOLD_PCT = 80  # Cảnh báo khi > 80% limit
CRITICAL_THRESHOLD_PCT = 92  # Critical khi > 92% limit


class Command(BaseCommand):
    help = (
        "Dọn dẹp session hết hạn, chạy VACUUM, và báo cáo storage Neon. "
        "Chạy định kỳ để tránh chạm limit 0.5 GB của Neon Free Plan."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chỉ hiển thị số lượng sẽ xoá, không thực hiện DELETE.",
        )
        parser.add_argument(
            "--report-only",
            action="store_true",
            help="Chỉ báo cáo storage, bỏ qua bước dọn dẹp.",
        )
        parser.add_argument(
            "--vacuum",
            action="store_true",
            help="Chạy VACUUM ANALYZE sau khi xoá (mặc định tự động chạy).",
        )
        parser.add_argument(
            "--session-ttl-days",
            type=int,
            default=7,
            help="Xoá PHP app_sessions hết hạn quá N ngày (mặc định: 7).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        report_only = options["report_only"]
        session_ttl_days = options["session_ttl_days"]

        self.stdout.write(self.style.HTTP_INFO(
            f"\n{'='*60}\n  FTC-VirtualDevices — DB Cleanup & Storage Monitor\n{'='*60}"
        ))

        # 1. Báo cáo storage hiện tại
        storage_mb = self._report_storage()

        if report_only:
            return

        # 2. Xoá app_sessions (PHP) hết hạn
        php_deleted = self._cleanup_php_sessions(dry_run, session_ttl_days)

        # 3. Xoá django_session hết hạn
        django_deleted = self._cleanup_django_sessions(dry_run)

        # 4. Xoá login_logs cũ hơn 90 ngày
        log_deleted = self._cleanup_old_logs(dry_run, days=90)

        # 5. VACUUM ANALYZE
        if not dry_run:
            self._run_vacuum()

        # 6. Báo cáo sau cleanup
        if not dry_run:
            storage_after_mb = self._get_db_size_mb()
            freed_mb = max(0, storage_mb - storage_after_mb)
            self.stdout.write(self.style.SUCCESS(
                f"\n=== Cleanup hoàn thành ===\n"
                f"   PHP sessions xoá     : {php_deleted}\n"
                f"   Django sessions xoá  : {django_deleted}\n"
                f"   Login logs xoá       : {log_deleted}\n"
                f"   Dung lượng giải phóng: ~{freed_mb:.2f} MB\n"
                f"   Dung lượng hiện tại  : {storage_after_mb:.2f} MB / {NEON_FREE_LIMIT_MB} MB"
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f"\n[DRY-RUN] Sẽ xoá: {php_deleted} PHP sessions, "
                f"{django_deleted} Django sessions, {log_deleted} login logs."
            ))

    # ──────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────

    def _get_db_size_mb(self) -> float:
        """Trả về kích thước DB hiện tại theo MB."""
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pg_database_size(current_database()) / 1024.0 / 1024.0"
            )
            row = cursor.fetchone()
            return float(row[0]) if row else 0.0

    def _report_storage(self) -> float:
        """In báo cáo storage và trả về size_mb."""
        size_mb = self._get_db_size_mb()
        pct = (size_mb / NEON_FREE_LIMIT_MB) * 100

        self.stdout.write(f"\nNeon Storage Report:")
        self.stdout.write(f"   Dung luong  : {size_mb:.2f} MB / {NEON_FREE_LIMIT_MB} MB  ({pct:.1f}%)")

        # Thanh progress ASCII
        bar_width = 40
        filled = int(bar_width * pct / 100)
        bar = "#" * filled + "-" * (bar_width - filled)
        self.stdout.write(f"   [{bar}] {pct:.1f}%")

        if pct >= CRITICAL_THRESHOLD_PCT:
            self.stdout.write(self.style.ERROR(
                f"   NGUY HIEM! Dang dung {pct:.1f}% limit!"
                f" Neon se chuyen DB sang read-only neu vuot 100%."
                f" Hay nang len Neon Launch ngay!"
            ))
        elif pct >= WARN_THRESHOLD_PCT:
            self.stdout.write(self.style.WARNING(
                f"   CANH BAO! Dang dung {pct:.1f}% limit."
                f" Can don dep hoac nang plan som."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(f"   Dung luong binh thuong."))

        # Top 8 bảng lớn nhất
        self._report_top_tables()

        return size_mb

    def _report_top_tables(self):
        """In top 8 bảng lớn nhất trong DB."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        schemaname || '.' || tablename AS table_name,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
                        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
                    FROM pg_tables
                    WHERE schemaname IN ('public', 'django')
                    ORDER BY size_bytes DESC
                    LIMIT 8;
                """)
                rows = cursor.fetchall()

            if rows:
                self.stdout.write("\n   Top bang theo kich thuoc:")
                for name, size, _ in rows:
                    self.stdout.write(f"      {size:>10}  {name}")
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"   (Khong the lay top tables: {exc})"))

    def _cleanup_php_sessions(self, dry_run: bool, ttl_days: int) -> int:
        """Xoá app_sessions (PHP) đã hết hạn."""
        try:
            with connection.cursor() as cursor:
                # Kiểm tra bảng tồn tại
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = 'app_sessions'
                    )
                """)
                if not cursor.fetchone()[0]:
                    self.stdout.write("   Bang app_sessions khong ton tai, bo qua.")
                    return 0

                cursor.execute(
                    "SELECT COUNT(*) FROM app_sessions WHERE expires_at < NOW()"
                )
                count = cursor.fetchone()[0]

                if not dry_run and count > 0:
                    cursor.execute(
                        "DELETE FROM app_sessions WHERE expires_at < NOW()"
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"   PHP app_sessions: xoa {count} session het han."
                    ))
                elif dry_run:
                    self.stdout.write(
                        f"   [DRY-RUN] PHP app_sessions: se xoa {count} session."
                    )
                else:
                    self.stdout.write(
                        "   PHP app_sessions: khong co session nao het han."
                    )

                return count
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"   Loi cleanup PHP sessions: {exc}"))
            return 0

    def _cleanup_django_sessions(self, dry_run: bool) -> int:
        """Xoá django_session hết hạn (Django built-in)."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = 'django_session'
                    )
                """)
                if not cursor.fetchone()[0]:
                    self.stdout.write("   Bang django_session khong ton tai, bo qua.")
                    return 0

                cursor.execute(
                    "SELECT COUNT(*) FROM django_session WHERE expire_date < NOW()"
                )
                count = cursor.fetchone()[0]

                if not dry_run and count > 0:
                    cursor.execute(
                        "DELETE FROM django_session WHERE expire_date < NOW()"
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"   Django sessions: xoa {count} session het han."
                    ))
                elif dry_run:
                    self.stdout.write(
                        f"   [DRY-RUN] Django sessions: se xoa {count} session."
                    )
                else:
                    self.stdout.write(
                        "   Django sessions: khong co session nao het han."
                    )

                return count
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"   Loi cleanup Django sessions: {exc}"))
            return 0

    def _cleanup_old_logs(self, dry_run: bool, days: int = 90) -> int:
        """Xoá login_logs cũ hơn N ngày để giải phóng storage."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = 'login_logs'
                    )
                """)
                if not cursor.fetchone()[0]:
                    return 0

                cursor.execute(
                    "SELECT COUNT(*) FROM login_logs WHERE created_at < NOW() - INTERVAL %s",
                    [f"{days} days"],
                )
                count = cursor.fetchone()[0]

                if not dry_run and count > 0:
                    cursor.execute(
                        "DELETE FROM login_logs WHERE created_at < NOW() - INTERVAL %s",
                        [f"{days} days"],
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"   login_logs cu hon {days} ngay: xoa {count} ban ghi."
                    ))
                elif dry_run:
                    self.stdout.write(
                        f"   [DRY-RUN] login_logs: se xoa {count} ban ghi cu hon {days} ngay."
                    )

                return count
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"   Khong the cleanup login_logs: {exc}"))
            return 0

    def _run_vacuum(self):
        """Chạy VACUUM ANALYZE trên các bảng phổ biến để thu hồi space."""
        tables_to_vacuum = [
            "app_sessions",
            "django_session",
            "login_logs",
            "activity_logs",
            "timer_sessions",
        ]
        self.stdout.write("\n   Dang chay VACUUM ANALYZE...")
        conn_obj = connection.connection
        old_autocommit = getattr(conn_obj, "autocommit", True) if conn_obj else True
        try:
            if conn_obj:
                conn_obj.autocommit = True
            with connection.cursor() as cursor:
                for table in tables_to_vacuum:
                    try:
                        cursor.execute(f"VACUUM ANALYZE {table}")
                        self.stdout.write(f"      VACUUM ANALYZE {table} - OK")
                    except Exception:
                        pass  # Bảng không tồn tại — bỏ qua
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"   VACUUM skipped: {exc}"))
        finally:
            if conn_obj:
                try:
                    conn_obj.autocommit = old_autocommit
                except Exception:
                    pass
