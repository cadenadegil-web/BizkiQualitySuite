import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import Date
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

if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.evidence import Evidence


class CAPA(Base):
    """
    Corrective and Preventive Actions (CAPA)
    """

    __tablename__ = "capas"

    # =====================================================
    # Identificador
    # =====================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # =====================================================
    # Relación con Hallazgo
    # =====================================================

    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "findings.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # =====================================================
    # Información CAPA
    # =====================================================

    code: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    action_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="Media",
        nullable=False,
    )

    responsible: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    target_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    completion_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    # =====================================================
    # Revisión de eficacia
    # =====================================================

    effectiveness_review: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    effectiveness_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    # =====================================================
    # Estado
    # =====================================================

    status: Mapped[str] = mapped_column(
        String(30),
        default="ABIERTA",
        nullable=False,
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # =====================================================
    # Auditoría
    # =====================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # =====================================================
    # Relaciones ORM
    # =====================================================

    finding: Mapped["Finding"] = relationship(
        "Finding",
        back_populates="capas",
    )

    evidences: Mapped[list["Evidence"]] = relationship(
        "Evidence",
        back_populates="capa",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # =====================================================
    # Representación
    # =====================================================

    def __repr__(self) -> str:
        return (
            f"<CAPA("
            f"code='{self.code}', "
            f"title='{self.title}', "
            f"status='{self.status}')>"
        )