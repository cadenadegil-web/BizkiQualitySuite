

from app.database.base import Base
from app.database.connection import engine
from app.database.session import SessionLocal

from app.database.seed import seed_database

# Modelos
from app.models.user import User
from app.models.finding import Finding
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status


def create_database():

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        seed_database(db)

    finally:
        db.close()