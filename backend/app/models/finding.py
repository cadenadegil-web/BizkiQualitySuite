import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.area import Area
    from app.models.classification import Classification
    from app.models.status import Status
    from app.models.user import User
    from app.models.capa import CAPA
    from app.models.evidence import Evidence


class Finding(Base):
    """
    Hallazgos BPM / Calidad.
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
        nullable=False,
        server_default=func.now(),
   )

    # =====================================================
    # Foreign Keys
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
    # Relaciones ORM
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

    capas: Mapped[list["CAPA"]] = relationship(
        "CAPA",
        back_populates="finding",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    evidences: Mapped[list["Evidence"]] = relationship(
        "Evidence",
        back_populates="finding",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # =====================================================
    # Representación
    # =====================================================

    def __repr__(self) -> str:
        return (
            f"<Finding(code='{self.code}', "
            f"process='{self.process}')>"
        )