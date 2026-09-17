#!/bin/sh
set -e

cd /app

PORT="${PORT:-${PORTAL_PORT:-8080}}"
API_PORT="${API_PORT:-8081}"
DJANGO_PORT="${DJANGO_PORT:-8083}"
API_BIND_HOST="${API_BIND_HOST:-127.0.0.1}"
DJANGO_BIND_HOST="${DJANGO_BIND_HOST:-127.0.0.1}"

echo "Starting FTC Virtual Devices (dispatcher on ${PORT}, API on ${API_BIND_HOST}:${API_PORT}, Admin on ${DJANGO_BIND_HOST}:${DJANGO_PORT})..."

# 1. Database migrations PHP (idempotent; only if a database is configured)
if [ -n "$DATABASE_URL" ] || [ -n "$PGHOST" ]; then
    echo "Running PHP database migrations..."
    attempt=1
    while [ "$attempt" -le 5 ]; do
        if php api/migrate.php; then
            break
        fi
        if [ "$attempt" -eq 5 ]; then
            echo "ERROR: PHP migrations failed after 5 attempts; refusing to start."
            exit 1
        fi
        echo "Migration attempt $attempt failed; retrying in 5s..."
        attempt=$((attempt + 1))
        sleep 5
    done

    echo "Running Django Admin migrations (auth, sessions, contenttypes only)..."
    if ! DJANGO_SETTINGS_MODULE=admin_site.settings \
        python admin_app/manage.py migrate --run-syncdb --noinput; then
        echo "ERROR: Django migrations failed; refusing to start."
        exit 1
    fi

    echo "Creating Django superuser (if DJANGO_SUPERUSER_PASSWORD is set)..."
    if ! DJANGO_SETTINGS_MODULE=admin_site.settings \
        python admin_app/create_superuser.py; then
        echo "ERROR: Unable to create or verify Django superuser."
        exit 1
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
START_PHP=0 API_PORT=${API_PORT} DJANGO_PORT=${DJANGO_PORT} python3 run_all.py &
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
