"""Application configuration helpers for Flask/SQLAlchemy.

Provides get_database_uri() which prefers DATABASE_URL from the environment
and falls back to a local sqlite file for offline development. It also
fixes legacy 'postgres://' URLs to 'postgresql://' for SQLAlchemy 1.4+.
"""
from pathlib import Path
import os
from sqlalchemy.pool import NullPool

BASE_DIR = Path(__file__).resolve().parent


def get_database_uri():
    """Return a SQLAlchemy-compatible database URI.

    Priority:
    1) Environment variable DATABASE_URL (commonly set by hosting providers)
       - If it uses the legacy 'postgres://' scheme, replace with 'postgresql://'
         for SQLAlchemy 1.4+ compatibility.
    2) Fallback to local SQLite file for offline development: sqlite:///site.db
    """
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        # Some providers set the URL with 'postgres://' (deprecated) which
        # SQLAlchemy 1.4+ will warn about or treat differently. Convert it.
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        return db_url

    # Local fallback
    sqlite_path = BASE_DIR / 'site.db'
    return f"sqlite:///{sqlite_path}"


def get_sqlalchemy_config():
    """Return a dict of common SQLAlchemy settings to apply to Flask app.config.

    When running against a hosted Postgres DB in serverless environments
    (Neon, Vercel), it's recommended to use a serverless-friendly pool such
    as `NullPool` to avoid connection exhaustion. Optionally set the
    `PG_SSLMODE` environment variable (for example 'require') to enforce
    SSL when connecting to the provider.
    """
    uri = get_database_uri()
    cfg = {
        'SQLALCHEMY_DATABASE_URI': uri,
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    }

    # If we're using Postgres in production, add engine options that are
    # safer for serverless deployments (NullPool) and allow optional SSL.
    if uri and uri.startswith(('postgresql://', 'postgres://')):
        engine_opts = {'poolclass': NullPool}
        pg_sslmode = os.environ.get('PG_SSLMODE') or os.environ.get('DB_SSLMODE')
        if pg_sslmode:
            # Pass through sslmode to the driver (psycopg2)
            engine_opts['connect_args'] = {'sslmode': pg_sslmode}

        cfg['SQLALCHEMY_ENGINE_OPTIONS'] = engine_opts

    return cfg
