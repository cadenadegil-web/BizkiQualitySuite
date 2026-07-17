app/models/classification.py
import uuid

from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.database.base import Base


class Classification(Base):

    __tablename__ = "classifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )