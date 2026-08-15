import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import String
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base


if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.evidence import Evidence


class User(Base):
    """
    Usuarios del sistema Bizki Quality Suite.

    Roles sugeridos:

        - Administrador
        - Coordinador de Calidad
        - Supervisor de Calidad
        - Supervisor de Producción
        - Auditor
        - Operario
    """

    __tablename__ = "users"

    # =====================================================
    # Identificador
    # =====================================================

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # =====================================================
    # Información del usuario
    # =====================================================

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    # =====================================================
    # Seguridad
    # =====================================================

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # =====================================================
    # Estado
    # =====================================================

    is_active: Mapped[bool] = mapped_column(
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

    # =====================================================
    # Relaciones
    # =====================================================

    findings: Mapped[list["Finding"]] = relationship(
        "Finding",
        back_populates="user",
        lazy="select",
        cascade="save-update",
    )

    evidences: Mapped[list["Evidence"]] = relationship(
        "Evidence",
        back_populates="user",
        lazy="selectin",
    )

    # =====================================================
    # Representación
    # =====================================================

    def __repr__(self) -> str:
        return (
            f"<User("
            f"username='{self.username}', "
            f"role='{self.role}')>"
        )