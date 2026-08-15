from sqlalchemy import URL, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

if settings.DATABASE_URL:
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    DATABASE_URL = db_url
else:
    DATABASE_URL = URL.create(
        drivername="postgresql+psycopg2",
        username=settings.DATABASE_USER,
        password=settings.DATABASE_PASSWORD,
        host=settings.DATABASE_HOST,
        port=settings.DATABASE_PORT,
        database=settings.DATABASE_NAME,
    )

engine = create_engine(
    DATABASE_URL,
    echo=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)