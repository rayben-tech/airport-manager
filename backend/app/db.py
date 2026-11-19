"""SQLAlchemy engine and session. The schema is owned by database/*.sql: never create or alter tables here."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings

engine = create_engine(
    get_settings().database_url,
    pool_pre_ping=True,  # hosted databases drop idle connections
    pool_recycle=280,
    pool_size=5,
    max_overflow=5,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
