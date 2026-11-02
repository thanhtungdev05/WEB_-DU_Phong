"""
db_guardian.py — Background scheduler bảo vệ Neon + Render khỏi chạm limit.

Chạy như một daemon thread trong run_all.py. Tự động:
1. Xoá app_sessions hết hạn mỗi 6 giờ
2. Kiểm tra storage Neon mỗi 2 giờ và in cảnh báo khi > 80%
3. Có thể tự kiểm tra /health/live; không coi đây là bảo đảm chống Render spin-down
4. Ghi log vào stderr để Render Logs có thể theo dõi
5. Cảnh báo quota qua webhook HTTPS (Discord/Slack) và/hoặc Zalo OA (xem send_zalo)

Không có dependency ngoài stdlib + psycopg (đã có sẵn qua Django).
"""
from __future__ import annotations

import logging
import os
import sys
import threading
import time
import json
import urllib.error
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
QUOTA_CHECK_INTERVAL_SEC   = 15 * 60       # Neon API; không đánh thức compute nên không tốn CU-hours

# Ngưỡng cảnh báo quota Neon (compute hours / data transfer), theo % limit.
QUOTA_LEVELS = ((95, "CRITICAL"), (85, "HIGH"), (70, "WARN"))
ALERT_COOLDOWN_SEC = 6 * 3600              # Nhắc lại cùng mức sau 6 giờ
FREE_COMPUTE_LIMIT_HOURS = 100.0
FREE_DATA_TRANSFER_LIMIT_GB = 5.0
_alert_state: dict[str, tuple[int, float]] = {}
_alert_lock = threading.Lock()

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
                        "DELETE FROM app_sessions WHERE expires_at < NOW()"
                    )
                    results["app_sessions"] = cur.rowcount
                except Exception as exc:
                    log.debug("app_sessions cleanup skip: %s", exc)

                # Django sessions
                try:
                    cur.execute(
                        "DELETE FROM django_session WHERE expire_date < NOW()"
                    )
                    results["django_session"] = cur.rowcount
                except Exception as exc:
                    log.debug("django_session cleanup skip: %s", exc)

                # Login logs > 90 ngày
                try:
                    cur.execute(
                        "DELETE FROM login_logs "
                        "WHERE created_at < NOW() - INTERVAL '90 days'"
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


# ── Neon quota alerts ────────────────────────────────────────────

def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, "").strip() or default)
    except ValueError:
        return default


def send_alert(key: str, rank: int, message: str) -> bool:
    """Log + optional webhook. Only fires on escalation or after cooldown."""
    now = time.time()
    with _alert_lock:
        last_rank, last_ts = _alert_state.get(key, (0, 0.0))
        if rank <= 0:
            _alert_state.pop(key, None)  # recovered; allow a fresh alert later
            return False
        if rank <= last_rank and (now - last_ts) < ALERT_COOLDOWN_SEC:
            return False
        _alert_state[key] = (rank, now)

    log.error("ALERT %s", message)
    deliver_alert(message)
    return True


def deliver_alert(message: str) -> None:
    """Send to every configured channel; one failing channel never blocks another."""
    send_webhook(message)
    send_zalo(message)


def send_webhook(message: str) -> bool:
    webhook = os.environ.get("ALERT_WEBHOOK_URL", "").strip()
    if not webhook.lower().startswith("https://"):
        return False
    # 'content' (Discord) and 'text' (Slack/Mattermost) in one payload.
    payload = json.dumps({"content": message, "text": message}).encode("utf-8")
    try:
        req = urllib.request.Request(
            webhook,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "db-guardian/1.0"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=8).read()
        return True
    except Exception as exc:  # never let alerting break the guardian
        log.warning("Webhook alert failed: %s", type(exc).__name__)
        return False


# ── Zalo OA channel ──────────────────────────────────────────────
# Zalo rotates the refresh token on every refresh, so the newest one is persisted
# to ZALO_TOKEN_STORE (default: system temp dir, mode 0600). If the store is lost
# (e.g. redeploy) we fall back to ZALO_REFRESH_TOKEN from the environment.
# Tokens are never logged. OA can only message users who interacted with the OA
# within the last 7 days.
ZALO_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token"
ZALO_SEND_URL = "https://openapi.zalo.me/v3.0/oa/message/cs"
_zalo_lock = threading.Lock()
_zalo_access: dict[str, float | str] = {"token": "", "expires_at": 0.0}


def _zalo_settings() -> tuple[str, str, str] | None:
    app_id = os.environ.get("ZALO_APP_ID", "").strip()
    secret = os.environ.get("ZALO_APP_SECRET", "").strip()
    user_id = os.environ.get("ZALO_ALERT_USER_ID", "").strip()
    if app_id and secret and user_id:
        return app_id, secret, user_id
    return None


def _zalo_store_path() -> str:
    configured = os.environ.get("ZALO_TOKEN_STORE", "").strip()
    if configured:
        return configured
    import tempfile
    return os.path.join(tempfile.gettempdir(), "ftc-zalo-token.json")


def _zalo_read_store() -> dict:
    try:
        with open(_zalo_store_path(), "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def _zalo_write_store(refresh_token: str) -> None:
    path = _zalo_store_path()
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump({"refresh_token": refresh_token, "saved_at": int(time.time())}, handle)
    except OSError as exc:
        log.warning("Khong luu duoc Zalo token store: %s", type(exc).__name__)


def _zalo_post(url: str, data: bytes, headers: dict) -> dict:
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            return json.loads(exc.read().decode("utf-8"))
        except ValueError:
            return {"error": exc.code}


def _zalo_refresh_access_token(app_id: str, secret: str) -> str:
    """Exchange the refresh token for a new access token; returns '' on failure."""
    import urllib.parse
    candidates = []
    for token in (_zalo_read_store().get("refresh_token"), os.environ.get("ZALO_REFRESH_TOKEN", "").strip()):
        if token and token not in candidates:
            candidates.append(str(token))
    for refresh_token in candidates:
        body = urllib.parse.urlencode({
            "grant_type": "refresh_token",
            "app_id": app_id,
            "refresh_token": refresh_token,
        }).encode("utf-8")
        result = _zalo_post(ZALO_TOKEN_URL, body, {
            "Content-Type": "application/x-www-form-urlencoded",
            "secret_key": secret,
        })
        access = str(result.get("access_token") or "")
        if access:
            new_refresh = str(result.get("refresh_token") or refresh_token)
            _zalo_write_store(new_refresh)
            try:
                ttl = float(result.get("expires_in") or 3600)
            except (TypeError, ValueError):
                ttl = 3600.0
            _zalo_access["token"] = access
            _zalo_access["expires_at"] = time.time() + max(60.0, ttl - 120.0)
            return access
        log.warning("Zalo refresh token that bai (error=%s).", result.get("error"))
    return ""


def send_zalo(message: str) -> bool:
    settings = _zalo_settings()
    if settings is None:
        return False
    app_id, secret, user_id = settings
    body = json.dumps(
        {"recipient": {"user_id": user_id}, "message": {"text": message[:2000]}},
        ensure_ascii=False,
    ).encode("utf-8")
    try:
        with _zalo_lock:
            access = str(_zalo_access["token"]) if time.time() < float(_zalo_access["expires_at"]) else ""
            if not access:
                access = _zalo_refresh_access_token(app_id, secret)
        if not access:
            return False
        for attempt in (1, 2):
            result = _zalo_post(ZALO_SEND_URL, body, {
                "Content-Type": "application/json",
                "access_token": access,
            })
            code = result.get("error")
            if code == 0:
                return True
            log.warning("Zalo gui tin that bai (error=%s).", code)
            if attempt == 1 and code in (-216, -217, -220):  # token invalid/expired
                with _zalo_lock:
                    access = _zalo_refresh_access_token(app_id, secret)
                if access:
                    continue
            break
    except Exception as exc:  # never let alerting break the guardian
        log.warning("Zalo alert failed: %s", type(exc).__name__)
    return False



def quota_level(pct: float) -> tuple[int, str]:
    """Return (rank, label); rank 0 means below every threshold."""
    for index, (threshold, label) in enumerate(QUOTA_LEVELS):
        if pct >= threshold:
            return len(QUOTA_LEVELS) - index, label
    return 0, "OK"


def _neon_get(path: str, api_key: str) -> dict:
    req = urllib.request.Request(
        "https://console.neon.tech/api/v2" + path,
        headers={"Accept": "application/json", "Authorization": "Bearer " + api_key},
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _neon_project(api_key: str) -> dict | None:
    project_id = os.environ.get("NEON_PROJECT_ID", "").strip()
    if project_id:
        return _neon_get("/projects/" + project_id, api_key).get("project")
    projects = _neon_get("/projects?limit=10", api_key).get("projects") or []
    if len(projects) == 1:
        return projects[0]
    log.warning("Dat NEON_PROJECT_ID de bat canh bao quota (khong xac dinh duoc project).")
    return None


def check_neon_quota() -> dict:
    """Compare Neon compute-time and data-transfer usage against plan limits.

    Free plan hard-suspends compute at 100 CU-hours or 5 GB transfer. Paid plans:
    set NEON_COMPUTE_LIMIT_HOURS / NEON_DATA_TRANSFER_LIMIT_GB (0 disables a check).
    """
    api_key = os.environ.get("NEON_API_KEY", "").strip()
    if not api_key:
        return {}
    try:
        project = _neon_project(api_key)
    except (urllib.error.URLError, OSError, ValueError) as exc:
        log.warning("Khong goi duoc Neon API: %s", type(exc).__name__)
        return {}
    if not project:
        return {}

    quota = (project.get("settings") or {}).get("quota") or {}
    compute_limit_h = _env_float("NEON_COMPUTE_LIMIT_HOURS", 0.0) or (
        float(quota.get("compute_time_seconds") or 0) / 3600 or FREE_COMPUTE_LIMIT_HOURS
    )
    transfer_limit_gb = _env_float("NEON_DATA_TRANSFER_LIMIT_GB", FREE_DATA_TRANSFER_LIMIT_GB)
    compute_h = float(project.get("compute_time_seconds") or 0) / 3600
    transfer_gb = float(project.get("data_transfer_bytes") or 0) / 1e9

    result: dict[str, float] = {}
    for key, used, limit, unit in (
        ("compute", compute_h, compute_limit_h, "gio compute"),
        ("transfer", transfer_gb, transfer_limit_gb, "GB data transfer"),
    ):
        if limit <= 0:
            continue
        pct = used / limit * 100
        result[key] = round(pct, 1)
        rank, label = quota_level(pct)
        message = (
            f"[FTC Neon {label}] {used:.2f}/{limit:.0f} {unit} ({pct:.0f}%). "
            "Chay het quota thi Neon free se TAM DUNG compute: moi truy van DB deu loi. "
            "Hay nang plan hoac chuan bi cutover sang FALLBACK_DATABASE_URL."
        )
        if rank > 0:
            send_alert("neon_" + key, rank, message)
        else:
            send_alert("neon_" + key, 0, "")
            log.info("Neon %s OK: %.2f/%.0f (%.0f%%)", key, used, limit, pct)
    return result


# ── Worker threads ───────────────────────────────────────────────

def _quota_monitor_worker():
    """Thread kiem tra quota Neon qua Management API."""
    time.sleep(FIRST_RUN_DELAY_SEC)
    while True:
        try:
            check_neon_quota()
        except Exception as exc:
            log.warning("quota_monitor error: %s", type(exc).__name__)
        time.sleep(QUOTA_CHECK_INTERVAL_SEC)



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
    if os.environ.get("NEON_API_KEY", "").strip():
        threads.append(("neon-quota-monitor", _quota_monitor_worker))
    else:
        log.warning("NEON_API_KEY chua dat: khong co canh bao quota Neon.")

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


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test-alert":
        text = "[FTC] Tin thu canh bao tu db_guardian. Neu ban doc duoc tin nay, kenh canh bao hoat dong."
        print("webhook:", "OK" if send_webhook(text) else "khong cau hinh hoac loi")
        print("zalo:   ", "OK" if send_zalo(text) else "khong cau hinh hoac loi (xem log)")
    else:
        print("Usage: python db_guardian.py test-alert")
