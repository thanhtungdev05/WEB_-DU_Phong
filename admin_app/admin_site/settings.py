"""
Django settings cho FTC Admin Panel.
Kết nối vào cùng Neon DB với PHP API (managed=False cho mọi model).
Chỉ dùng nội bộ - /admin/* được proxy bởi run_all.py dispatcher.
"""
import os
import sys
from urllib.parse import urlparse
import dj_database_url

# BASE_DIR = thư mục admin_app/ (cha của admin_site/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Đảm bảo Python tìm được module admin_portal
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


# ===========================================================
# Core Security
# ===========================================================
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'ftc-dev-secret-key-change-in-production-please'
)
APP_ENV = os.environ.get('APP_ENV', 'development').strip().lower()
APP_BASE_URL = os.environ.get('APP_BASE_URL', '').strip()
IS_RENDER = os.environ.get('RENDER', '').strip().lower() == 'true'
IS_PRODUCTION = APP_ENV == 'production' or IS_RENDER
# Never expose Django's technical traceback on a public Render deployment,
# even if a stale environment variable still requests debug mode.
DEBUG = os.environ.get('DJANGO_DEBUG', '0') == '1' and not IS_PRODUCTION
if IS_PRODUCTION and SECRET_KEY == 'ftc-dev-secret-key-change-in-production-please':
    raise RuntimeError('DJANGO_SECRET_KEY must be configured in production.')

_configured_hosts = [
    host.strip()
    for host in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
    if host.strip()
]
_app_url = urlparse(APP_BASE_URL) if APP_BASE_URL else None
_app_host = _app_url.hostname if _app_url else None
ALLOWED_HOSTS = list(dict.fromkeys(_configured_hosts + [
    host for host in [_app_host, 'localhost', '127.0.0.1', '[::1]'] if host
]))

_configured_csrf_origins = [
    origin.strip().rstrip('/')
    for origin in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',')
    if origin.strip()
]
_app_origin = f'{_app_url.scheme}://{_app_url.netloc}' if _app_url and _app_url.scheme and _app_url.netloc else None
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(_configured_csrf_origins + [origin for origin in [
    _app_origin,
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8083',
    'http://127.0.0.1:8083',
] if origin]))

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_PATH = '/'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = IS_PRODUCTION
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = IS_PRODUCTION
SECURE_SSL_REDIRECT = IS_PRODUCTION
SECURE_HSTS_SECONDS = 31536000 if IS_PRODUCTION else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = IS_PRODUCTION
SECURE_HSTS_PRELOAD = IS_PRODUCTION
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'


# ===========================================================
# Apps
# ===========================================================
INSTALLED_APPS = [
    'admin_portal',              # app cụ thể dự án này
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'admin_site.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'admin_site.wsgi.application'

# ===========================================================
# Database — kết nối vào Neon PostgreSQL (hỗ trợ Auto-Failover)
# ===========================================================
_db_url = os.environ.get('DATABASE_URL', '')
_fallback_db_url = os.environ.get('FALLBACK_DATABASE_URL', '')
_target_url = _db_url

if os.environ.get('DATABASE_FORCE_FALLBACK', '0').strip() == '1' and _fallback_db_url:
    _target_url = _fallback_db_url
elif _db_url and _fallback_db_url:
    try:
        import psycopg
        with psycopg.connect(_db_url, connect_timeout=3):
            pass
    except Exception:
        _target_url = _fallback_db_url

if _target_url:
    _ssl_require = (
        'sslmode=disable' not in _target_url
        and '127.0.0.1' not in _target_url
        and 'localhost' not in _target_url
        and os.environ.get('PGSSLMODE', '').lower() != 'disable'
    )
    DATABASES = {
        'default': dj_database_url.parse(
            _target_url,
            conn_max_age=60,
            conn_health_checks=True,
            ssl_require=_ssl_require,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('PGDATABASE', 'neondb'),
            'USER': os.environ.get('PGUSER', 'postgres'),
            'PASSWORD': os.environ.get('PGPASSWORD', ''),
            'HOST': os.environ.get('PGHOST', 'localhost'),
            'PORT': os.environ.get('PGPORT', '5432'),
        }
    }

# ===========================================================
# Auth
# ===========================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ===========================================================
# Internationalization
# ===========================================================
LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

# ===========================================================
# Static files (phục vụ bởi Whitenoise)
# ===========================================================
STATIC_URL = '/admin-static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===========================================================
# Session (dùng bảng Django sessions - KHÔNG dùng chung với PHP)
# ===========================================================
SESSION_COOKIE_NAME = 'ftc_admin_session'
SESSION_COOKIE_AGE = 3600
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
