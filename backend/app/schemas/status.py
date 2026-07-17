app/models/status.py
import uuid

from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.database.base import Base


class Status(Base):

    __tablename__ = "statuses"

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
