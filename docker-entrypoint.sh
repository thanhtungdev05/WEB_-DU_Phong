#!/bin/sh
set -e

cd /app

PORT="${PORT:-${PORTAL_PORT:-8080}}"
API_PORT="${API_PORT:-8081}"
DJANGO_PORT="${DJANGO_PORT:-8083}"
API_BIND_HOST="${API_BIND_HOST:-127.0.0.1}"
DJANGO_BIND_HOST="${DJANGO_BIND_HOST:-127.0.0.1}"
ALLOW_START_WITHOUT_DATABASE="${ALLOW_START_WITHOUT_DATABASE:-1}"
DATABASE_STARTUP_ATTEMPTS="${DATABASE_STARTUP_ATTEMPTS:-5}"

case "$DATABASE_STARTUP_ATTEMPTS" in
    ''|*[!0-9]*|0) DATABASE_STARTUP_ATTEMPTS=5 ;;
esac

degraded_startup_enabled() {
    case "$ALLOW_START_WITHOUT_DATABASE" in
        1|true|TRUE|yes|YES|on|ON) return 0 ;;
        *) return 1 ;;
    esac
}

echo "Starting FTC Virtual Devices (dispatcher on ${PORT}, API on ${API_BIND_HOST}:${API_PORT}, Admin on ${DJANGO_BIND_HOST}:${DJANGO_PORT})..."

# 1. Database bootstrap (idempotent; only if a database is configured).
#    A database outage must not take the static portal and simulators offline.
#    Migration/configuration errors still fail closed when PostgreSQL is reachable.
if [ -n "$DATABASE_URL" ] || [ -n "$PGHOST" ]; then
    echo "Checking database availability..."
    attempt=1
    database_available=0
    while [ "$attempt" -le "$DATABASE_STARTUP_ATTEMPTS" ]; do
        if php api/database_probe.php; then
            database_available=1
            break
        else
            probe_status=$?
            if [ "$probe_status" -ne 1 ]; then
                echo "ERROR: Database configuration/probe failed; refusing to start."
                exit 1
            fi
        fi
        if [ "$attempt" -lt "$DATABASE_STARTUP_ATTEMPTS" ]; then
            echo "Database check $attempt failed; retrying in 5s..."
            sleep 5
        fi
        attempt=$((attempt + 1))
    done

    if [ "$database_available" -eq 0 ]; then
        if degraded_startup_enabled; then
            echo "WARNING: Database unavailable after ${DATABASE_STARTUP_ATTEMPTS} attempts; starting in degraded mode."
            echo "WARNING: Portal and simulators remain available. Login, dashboard, Admin, and DB-backed API features may return errors until PostgreSQL recovers."
        else
            echo "ERROR: Database unavailable after ${DATABASE_STARTUP_ATTEMPTS} attempts; refusing to start."
            exit 1
        fi
    fi

    if [ "$database_available" -eq 1 ]; then
        echo "Running PHP database migrations..."
        if ! php api/migrate.php; then
            if php api/database_probe.php; then
                echo "ERROR: PHP migrations failed while the database is reachable; refusing to start."
                exit 1
            else
                probe_status=$?
                if [ "$probe_status" -eq 1 ] && degraded_startup_enabled; then
                    database_available=0
                    echo "WARNING: Database became unavailable during PHP migrations; starting in degraded mode."
                else
                    echo "ERROR: PHP migrations failed and the database probe did not report a temporary outage; refusing to start."
                    exit 1
                fi
            fi
        fi
    fi

    if [ "$database_available" -eq 1 ]; then
        echo "Running Django Admin migrations (auth, sessions, contenttypes only)..."
        if ! DJANGO_SETTINGS_MODULE=admin_site.settings \
            python admin_app/manage.py migrate --run-syncdb --noinput; then
            if php api/database_probe.php; then
                echo "ERROR: Django migrations failed while the database is reachable; refusing to start."
                exit 1
            else
                probe_status=$?
                if [ "$probe_status" -eq 1 ] && degraded_startup_enabled; then
                    database_available=0
                    echo "WARNING: Database became unavailable during Django migrations; starting in degraded mode."
                else
                    echo "ERROR: Django migrations failed and the database probe did not report a temporary outage; refusing to start."
                    exit 1
                fi
            fi
        fi
    fi

    if [ "$database_available" -eq 1 ]; then
        echo "Creating Django superuser (if DJANGO_SUPERUSER_PASSWORD is set)..."
        if ! DJANGO_SETTINGS_MODULE=admin_site.settings \
            python admin_app/create_superuser.py; then
            if php api/database_probe.php; then
                echo "ERROR: Unable to create or verify Django superuser while the database is reachable."
                exit 1
            else
                probe_status=$?
                if [ "$probe_status" -eq 1 ] && degraded_startup_enabled; then
                    database_available=0
                    echo "WARNING: Database became unavailable while verifying the Django superuser; starting in degraded mode."
                else
                    echo "ERROR: Django superuser setup failed and the database probe did not report a temporary outage."
                    exit 1
                fi
            fi
        fi
    fi
else
    echo "No database configured (DATABASE_URL/PG*); skipping migrations."
fi

# 2. PHP API server (built-in, PATH_INFO routing: /api/index.php/<resource>).
#    Lang nghe theo API_BIND_HOST (127.0.0.1 hoac 0.0.0.0 trong container network).
PHP_CLI_SERVER_WORKERS="${PHP_API_WORKERS:-4}" \
    php -d post_max_size=30M -d upload_max_filesize=30M -d memory_limit=512M \
    -S ${API_BIND_HOST}:${API_PORT} -t /app > /tmp/php_api.log 2>&1 &
PHP_PID=$!

# 3. Django Admin — production WSGI server, internal-only.
DJANGO_SETTINGS_MODULE=admin_site.settings \
    gunicorn admin_site.wsgi:application \
    --chdir /app/admin_app \
    --bind ${DJANGO_BIND_HOST}:${DJANGO_PORT} \
    --workers "${DJANGO_WORKERS:-2}" \
    --threads "${DJANGO_THREADS:-4}" \
    --timeout 30 \
    --access-logfile - \
    --error-logfile - > /tmp/django_admin.log 2>&1 &
DJANGO_PID=$!

echo "Django Admin running on ${DJANGO_BIND_HOST}:${DJANGO_PORT} (proxied as /admin/)"

# 4. Master Dispatcher: portal + all device simulators + proxy /api/* + /admin/*
START_PHP=0 START_DJANGO=0 API_PORT=${API_PORT} DJANGO_PORT=${DJANGO_PORT} python3 run_all.py &
MASTER_PID=$!

echo "============================================================="
echo "  Portal + Devices + API + Admin: http://localhost:${PORT}  (single-port)"
echo "  Admin panel: http://localhost:${PORT}/admin/"
echo "============================================================="

cleanup() {
    echo "Stopping servers..."
    kill "$MASTER_PID" "$PHP_PID" "$DJANGO_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

while kill -0 "$MASTER_PID" 2>/dev/null \
   && kill -0 "$PHP_PID" 2>/dev/null \
   && kill -0 "$DJANGO_PID" 2>/dev/null; do
    sleep 2
done

echo "ERROR: A required service exited unexpectedly."
exit 1
