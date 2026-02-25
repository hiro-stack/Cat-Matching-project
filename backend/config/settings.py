"""
Django settings for cat matching project.
"""

import os
import dj_database_url
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# ALLOWED_HOSTS configuration for production
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Add Heroku hostname if present
HEROKU_APP_NAME = os.environ.get('HEROKU_APP_NAME')
if HEROKU_APP_NAME:
    ALLOWED_HOSTS.append(f'{HEROKU_APP_NAME}.herokuapp.com')


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # ログアウト時のトークン無効化
    'corsheaders',
    'drf_spectacular',
    'accounts',
    'shelters',
    'cats',
    'applications',
    'favorites',
    'storages',  # django-storages for S3-compatible storage
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# SUPABASE_DATABASE_URL が設定されている場合はそちらを優先（PostgreSQL）
_supabase_url = os.environ.get('SUPABASE_DATABASE_URL')
if _supabase_url:
    db_config = dj_database_url.parse(_supabase_url, conn_max_age=600)
else:
    db_config = dj_database_url.config(
        default=f"mysql://{os.environ.get('DB_USER', 'catuser')}:{os.environ.get('DB_PASSWORD', 'catpassword')}@{os.environ.get('DB_HOST', 'db')}:{os.environ.get('DB_PORT', '3306')}/{os.environ.get('DB_NAME', 'cat_matching')}",
        conn_max_age=600
    )
    if db_config['ENGINE'] == 'django.db.backends.mysql':
        db_config.setdefault('OPTIONS', {})['charset'] = 'utf8mb4'

DATABASES = {
    'default': db_config
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files - Cloudflare R2 (S3-compatible storage)
USE_R2_STORAGE = os.environ.get('USE_R2_STORAGE', 'False') == 'True'

if USE_R2_STORAGE:
    # R2 Storage Configuration
    AWS_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = os.environ.get('R2_ENDPOINT_URL')  # e.g., https://<account_id>.r2.cloudflarestorage.com
    AWS_S3_REGION_NAME = 'auto'  # R2 uses 'auto'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None  # R2 doesn't use ACLs by default
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }

    # Use custom domain for public access (optional)
    AWS_S3_CUSTOM_DOMAIN = os.environ.get('R2_PUBLIC_DOMAIN')  # e.g., media.example.com

    # Storage backend
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'
    else:
        MEDIA_URL = f'{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/'
else:
    # Local storage (development only)
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
    
    # Ensure MEDIA_ROOT exists
    if not os.path.exists(MEDIA_ROOT):
        os.makedirs(MEDIA_ROOT, exist_ok=True)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.JWTCookieAuthentication',  # HttpOnly Cookie + Authorizationヘッダー両対応
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # レート制限: ブルートフォース攻撃対策
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/day',
        'user': '2000/day',
        'login': '10/minute',      # ログイン試行: 1分に10回まで
        'register': '5/hour',      # 新規登録: 1時間に5回まで
    },
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://cat-maching.vercel.app",
]

if os.environ.get("FRONTEND_URL"):
    url = os.environ.get("FRONTEND_URL")
    if url not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(url)

# CSRF settings (Required for Django 4.0+)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://cat-maching.vercel.app",
]

if os.environ.get("FRONTEND_URL"):
    url = os.environ.get("FRONTEND_URL")
    if url not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(url)

CORS_ALLOW_CREDENTIALS = True

# JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # 1日→30分に短縮（盗難時リスク低減）
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,           # 使用ごとに新しいRefreshTokenを発行
    'BLACKLIST_AFTER_ROTATION': True,        # 古いRefreshTokenをブラックリスト化
    'UPDATE_LAST_LOGIN': False,
}

# パスワードリセットリンクの有効期限（秒）
PASSWORD_RESET_TIMEOUT = 3600  # 1時間（Djangoデフォルトの3日から短縮）

# Email settings
# Email settings
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': '保護猫マッチングシステム API',
    'DESCRIPTION': '保護猫と飼い主をマッチングするシステムのAPI',
    'VERSION': '1.0.0',
}

# Production Security Settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# File Upload Settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
