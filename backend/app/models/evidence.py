import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import BigInteger
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base


if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.capa import CAPA
    from app.models.user import User


class Evidence(Base):
    """
    Evidencias del sistema.

    Una evidencia puede estar asociada a un Hallazgo
    o a una Acción Correctiva/Preventiva (CAPA).
    """

    __tablename__ = "evidences"

    # =====================================================
    # Identificador
    # =====================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # =====================================================
    # Relaciones
    # =====================================================

    finding_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=True,
    )

    capa_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("capas.id", ondelete="CASCADE"),
        nullable=True,
    )

    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # =====================================================
    # Información del archivo
    # =====================================================

    original_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    extension: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

    file_size: Mapped[int] = mapped_column(
        BigInteger,
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
    # Relaciones ORM
    # =====================================================

    finding: Mapped["Finding | None"] = relationship(
        "Finding",
        back_populates="evidences",
        lazy="joined",
    )

    capa: Mapped["CAPA | None"] = relationship(
        "CAPA",
        back_populates="evidences",
        lazy="joined",
    )

    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="evidences",
        lazy="joined",
    )

    # =====================================================
    # Representación
    # =====================================================

    def __repr__(self) -> str:
        return (
            f"<Evidence("
            f"original_name='{self.original_name}', "
            f"mime_type='{self.mime_type}')>"
        )