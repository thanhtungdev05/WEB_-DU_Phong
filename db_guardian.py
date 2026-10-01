"""
db_guardian.py — Background scheduler bảo vệ Neon + Render khỏi chạm limit.

Chạy như một daemon thread trong run_all.py. Tự động:
1. Xoá app_sessions hết hạn mỗi 6 giờ
2. Kiểm tra storage Neon mỗi 2 giờ và in cảnh báo khi > 80%
3. Có thể tự kiểm tra /health/live; không coi đây là bảo đảm chống Render spin-down
4. Ghi log vào stderr để Render Logs có thể theo dõi

Không có dependency ngoài stdlib + psycopg (đã có sẵn qua Django).
"""
from __future__ import annotations

import logging
import os
import sys
import threading
import time
import urllib.request
from datetime import datetime, timezone

# ── Cấu hình ────────────────────────────────────────────────────
NEON_FREE_LIMIT_MB = 512
WARN_THRESHOLD_PCT = 80
CRITICAL_THRESHOLD_PCT = 92

# Khoảng thời gian chạy (giây)
STORAGE_CHECK_INTERVAL_SEC = 2 * 3600      # 2 giờ
CLEANUP_INTERVAL_SEC       = 6 * 3600      # 6 giờ
KEEPALIVE_INTERVAL_SEC     = 10 * 60       # 10 phút; chỉ dùng khi bật self-health ping
FIRST_RUN_DELAY_SEC        = 60            # Chờ 60s sau startup để DB ổn định

# ── Logger ──────────────────────────────────────────────────────
log = logging.getLogger("db_guardian")
if not log.handlers:
    _h = logging.StreamHandler(sys.stderr)
    _h.setFormatter(logging.Formatter("[db_guardian] %(levelname)s %(message)s"))
    log.addHandler(_h)
log.setLevel(logging.INFO)


# ── Database helper ─────────────────────────────────────────────

def _get_db_connection(db_url: str | None = None):
    """Lấy kết nối psycopg từ DATABASE_URL hoặc connection string được chỉ định."""
    import psycopg  # type: ignore
    target_url = db_url or os.environ.get("DATABASE_URL", "")
    if not target_url:
        raise RuntimeError("DATABASE_URL chưa được cấu hình.")
    return psycopg.connect(target_url, autocommit=True)


def get_database_selection() -> tuple[str, str, str, str]:
    """Return active tier/url and standby tier/url without exposing credentials."""
    active_tier = os.environ.get("DATABASE_ACTIVE", "primary").strip().lower()
    if active_tier not in {"primary", "fallback"}:
        raise RuntimeError("DATABASE_ACTIVE must be either primary or fallback.")

    primary_url = os.environ.get("DATABASE_URL", "").strip()
    fallback_url = os.environ.get("FALLBACK_DATABASE_URL", "").strip()
    if active_tier == "fallback":
        if not fallback_url:
            raise RuntimeError("DATABASE_ACTIVE=fallback requires FALLBACK_DATABASE_URL.")
        return "fallback", fallback_url, "primary", primary_url
    if not primary_url:
        raise RuntimeError("DATABASE_ACTIVE=primary requires DATABASE_URL.")
    return "primary", primary_url, "fallback", fallback_url


def check_storage() -> float:
    """Return active DB size (MB), and report active/standby health separately."""
    size_mb = 0.0

    try:
        active_tier, active_url, standby_tier, standby_url = get_database_selection()
        with _get_db_connection(active_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT pg_database_size(current_database()) / 1024.0 / 1024.0"
                )
                row = cur.fetchone()
                size_mb = float(row[0]) if row else 0.0

        pct = (size_mb / NEON_FREE_LIMIT_MB) * 100
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        if pct >= CRITICAL_THRESHOLD_PCT:
            log.error(
                "[%s] NGUY HIEM active DB (%s): %.2f MB / %d MB (%.1f%%). "
                "Can thuc hien controlled cutover; guardian se khong tu doi DB.",
                ts, active_tier, size_mb, NEON_FREE_LIMIT_MB, pct,
            )
        elif pct >= WARN_THRESHOLD_PCT:
            log.warning(
                "[%s] CANH BAO active DB (%s): %.2f MB / %d MB (%.1f%%). "
                "Can chuan bi controlled cutover.",
                ts, active_tier, size_mb, NEON_FREE_LIMIT_MB, pct,
            )
        else:
            log.info(
                "[%s] Active DB (%s) storage OK: %.2f MB / %d MB (%.1f%%).",
                ts, active_tier, size_mb, NEON_FREE_LIMIT_MB, pct,
            )

        if standby_url:
            try:
                with _get_db_connection(standby_url) as fb_conn:
                    with fb_conn.cursor() as fb_cur:
                        fb_cur.execute("SELECT pg_database_size(current_database()) / 1024.0 / 1024.0")
                        fb_row = fb_cur.fetchone()
                        fb_size_mb = float(fb_row[0]) if fb_row else 0.0
                        log.info("[%s] Standby DB (%s): %.2f MB / %d MB (connection OK).", ts, standby_tier, fb_size_mb, NEON_FREE_LIMIT_MB)
            except Exception as fb_exc:
                log.warning("[%s] Khong the ket noi standby DB (%s): %s", ts, standby_tier, fb_exc)

        return size_mb
    except Exception as exc:
        log.warning("Khong the kiem tra storage Neon: %s", exc)
        return 0.0


def cleanup_expired_sessions() -> dict:
    """Xoá session hết hạn và log/return kết quả."""
    results = {"app_sessions": 0, "django_session": 0, "login_logs": 0}
    try:
        active_tier, active_url, _, _ = get_database_selection()
        with _get_db_connection(active_url) as conn:
            with conn.cursor() as cur:
                # PHP app_sessions
                try:
                    cur.execute(
                        "DELETE FROM app_sessions WHERE expires_at < NOW() "
                        "RETURNING 1"
                    )
                    results["app_sessions"] = cur.rowcount
                except Exception as exc:
                    log.debug("app_sessions cleanup skip: %s", exc)

                # Django sessions
                try:
                    cur.execute(
                        "DELETE FROM django_session WHERE expire_date < NOW() "
                        "RETURNING 1"
                    )
                    results["django_session"] = cur.rowcount
                except Exception as exc:
                    log.debug("django_session cleanup skip: %s", exc)

                # Login logs > 90 ngày
                try:
                    cur.execute(
                        "DELETE FROM login_logs "
                        "WHERE created_at < NOW() - INTERVAL '90 days' "
                        "RETURNING 1"
                    )
                    results["login_logs"] = cur.rowcount
                except Exception as exc:
                    log.debug("login_logs cleanup skip: %s", exc)

        total = sum(results.values())
        if total > 0:
            log.info(
                "Cleanup xong: PHP sessions=%d, Django sessions=%d, login_logs=%d",
                results["app_sessions"],
                results["django_session"],
                results["login_logs"],
            )
        else:
            log.info("Cleanup active DB (%s): Khong co record het han nao can xoa.", active_tier)

    except Exception as exc:
        log.warning("Cleanup session that bai: %s", exc)

    return results


def keepalive_ping(base_url: str = "") -> bool:
    """Run an optional self-health check; this does not guarantee Render uptime."""
    if not base_url:
        port = os.environ.get("PORT", "8080")
        base_url = f"http://127.0.0.1:{port}"

    url = base_url.rstrip("/") + "/health/live"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "db-guardian/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            ok = resp.status == 200
            if not ok:
                log.warning("Keepalive ping %s -> HTTP %d", url, resp.status)
            return ok
    except Exception as exc:
        log.debug("Keepalive ping failed (co the service chua san sang): %s", exc)
        return False


# ── Worker threads ───────────────────────────────────────────────

def _storage_monitor_worker():
    """Thread kiểm tra storage định kỳ."""
    time.sleep(FIRST_RUN_DELAY_SEC)
    while True:
        try:
            check_storage()
        except Exception as exc:
            log.warning("storage_monitor error: %s", exc)
        time.sleep(STORAGE_CHECK_INTERVAL_SEC)


def _cleanup_worker():
    """Thread dọn dẹp session/log định kỳ."""
    # Chạy lần đầu sau FIRST_RUN_DELAY + 30s
    time.sleep(FIRST_RUN_DELAY_SEC + 30)
    while True:
        try:
            cleanup_expired_sessions()
        except Exception as exc:
            log.warning("cleanup_worker error: %s", exc)
        time.sleep(CLEANUP_INTERVAL_SEC)


def _keepalive_worker():
    """Optional periodic self-health check; it is not an uptime guarantee."""
    # Chờ service khởi động xong
    time.sleep(90)
    base_url = os.environ.get("APP_BASE_URL", "")
    while True:
        try:
            keepalive_ping(base_url)
        except Exception as exc:
            log.debug("keepalive_worker error: %s", exc)
        time.sleep(KEEPALIVE_INTERVAL_SEC)


# ── Public API ───────────────────────────────────────────────────

def start(enabled: bool = True):
    """
    Khởi động tất cả background daemon threads.
    Gọi một lần từ run_all.py sau khi server sẵn sàng.

    Args:
        enabled: Nếu False, không khởi động (dùng cho test/dev nhanh).
    """
    if not enabled:
        log.info("db_guardian disabled (enabled=False).")
        return

    is_render = os.environ.get("RENDER", "").lower() == "true"
    try:
        active_tier, _, _, _ = get_database_selection()
    except RuntimeError as exc:
        log.warning(
            "db_guardian se khong chay: %s", exc
        )
        return

    threads = [
        ("storage-monitor", _storage_monitor_worker),
        ("session-cleanup", _cleanup_worker),
    ]

    # Disabled by default because an internal/self ping is not an uptime SLA.
    self_ping_enabled = os.environ.get("RENDER_SELF_PING_ENABLED", "0").strip() == "1"
    if is_render and self_ping_enabled:
        threads.append(("render-keepalive", _keepalive_worker))
        log.info(
            "Render self-health ping enabled every %d minutes (not an uptime guarantee).",
            KEEPALIVE_INTERVAL_SEC // 60,
        )

    for name, target in threads:
        t = threading.Thread(target=target, name=name, daemon=True)
        t.start()
        log.info("Started daemon thread: %s", name)

    log.info(
        "db_guardian running for active DB (%s): storage check moi %dh, cleanup moi %dh.",
        active_tier,
        STORAGE_CHECK_INTERVAL_SEC // 3600,
        CLEANUP_INTERVAL_SEC // 3600,
    )
