from sqlalchemy import URL, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

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