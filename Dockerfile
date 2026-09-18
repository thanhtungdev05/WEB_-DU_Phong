FROM composer:2 AS composer

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        unzip \
        dos2unix \
        php-cli \
        php-curl \
        php-gd \
        php-mbstring \
        php-xml \
        php-zip \
        php-intl \
        php-pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/local/bin/composer

COPY . /app

RUN composer install --no-dev --no-interaction --prefer-dist --no-progress --no-ansi

# Cài Django dependencies cho Admin Panel
RUN pip install --no-cache-dir -r admin_app/requirements-admin.txt

# Collect static files cho Django Admin (CSS/JS)
RUN DJANGO_SETTINGS_MODULE=admin_site.settings \
    DJANGO_SECRET_KEY=build-time-placeholder \
    DATABASE_URL=postgresql://x:x@localhost/x \
    python admin_app/manage.py collectstatic --noinput --no-color

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN dos2unix /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# The public dispatcher and its internal workers do not require root access.
RUN useradd --system --uid 10001 --create-home ftc \
    && mkdir -p /app/scratch/sessions \
    && chown -R ftc:ftc /app
USER ftc

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8080') + '/api/health', timeout=4).read()"

ENTRYPOINT ["/docker-entrypoint.sh"]

