"""Settings from environment variables (and backend/.env when running locally)."""

import os
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Local development: backend/.env. Real environment variables (Railway) always win.
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)


class ConfigError(RuntimeError):
    pass


def normalize_database_url(url: str) -> str:
    """Accept mysql://, mysql+pymysql://, mysql+<other driver>:// (Railway gives mysql://) and use PyMySQL."""
    url = url.strip()
    if url.startswith("mysql+pymysql://"):
        normalized = url
    elif url.startswith("mysql://"):
        normalized = "mysql+pymysql://" + url[len("mysql://"):]
    elif url.startswith("mysql+") and "://" in url:
        normalized = "mysql+pymysql://" + url.split("://", 1)[1]
    else:
        raise ConfigError("DATABASE_URL doit commencer par mysql:// ou mysql+pymysql:// (exemple : mysql://user:password@host:3306/airport_manager)")
    if "charset=" not in normalized:
        normalized += ("&" if "?" in normalized else "?") + "charset=utf8mb4"
    return normalized


@dataclass(frozen=True)
class Settings:
    database_url: str
    jwt_secret: str
    cors_origins: list[str]
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    fixed_now: datetime | None = None  # APP_NOW: freeze "now" for the demo data (2026-11-18)

    def now(self) -> datetime:
        """Current local time (naive, like the DATETIME columns), or APP_NOW when set."""
        return self.fixed_now or datetime.now()


def _required(name: str, hint: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ConfigError(f"Variable d'environnement {name} manquante : {hint} (voir backend/.env.example).")
    return value


@lru_cache
def get_settings() -> Settings:
    database_url = normalize_database_url(_required("DATABASE_URL", "URL de connexion MySQL"))
    jwt_secret = _required("JWT_SECRET", "clé secrète pour signer les jetons JWT")
    origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
    app_now = os.getenv("APP_NOW", "").strip()
    try:
        fixed_now = datetime.fromisoformat(app_now) if app_now else None
    except ValueError as exc:
        raise ConfigError("APP_NOW doit être une date ISO 8601, par exemple 2026-11-18T08:00:00") from exc
    return Settings(database_url=database_url, jwt_secret=jwt_secret, cors_origins=origins, fixed_now=fixed_now)
