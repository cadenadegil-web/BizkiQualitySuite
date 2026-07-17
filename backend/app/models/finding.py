import uuid
from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base


class Finding(Base):
    """
    Hallazgos BPM / Calidad.

    Este modelo utiliza únicamente claves foráneas hacia los
    catálogos del sistema.
    """

    __tablename__ = "findings"

    # =====================================================
    # Identificador
    # =====================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # =====================================================
    # Información del hallazgo
    # =====================================================

    code: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    process: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    finding_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    responsible: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    # =====================================================
    # Estado
    # =====================================================

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # =====================================================
    # Relaciones (Foreign Keys)
    # =====================================================

    area_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("areas.id"),
        nullable=False,
    )

    classification_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classifications.id"),
        nullable=False,
    )

    status_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("statuses.id"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # =====================================================
    # ORM Relationships
    # =====================================================

    area: Mapped["Area"] = relationship(
        "Area",
        back_populates="findings",
        lazy="joined",
    )

    classification: Mapped["Classification"] = relationship(
        "Classification",
        back_populates="findings",
        lazy="joined",
    )

    status: Mapped["Status"] = relationship(
        "Status",
        back_populates="findings",
        lazy="joined",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="findings",
        lazy="joined",
    )

    # =====================================================
    # Representación
    # =====================================================

    def __repr__(self) -> str:
        return (
            f"<Finding("
            f"code='{self.code}', "
            f"process='{self.process}')>"
        )