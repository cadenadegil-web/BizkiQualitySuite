import uuid

from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base


class Area(Base):
    """
    Catálogo de áreas de la planta.

    Ejemplos:
        - Mezcla
        - Pre-pesado
        - Horno
        - Depositadora
        - Empaque
        - Enfriamiento
    """

    __tablename__ = "areas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # ==========================================
    # Relaciones
    # ==========================================

    findings: Mapped[list["Finding"]] = relationship(
        "Finding",
        back_populates="area",
        cascade="save-update",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Area("
            f"id={self.id}, "
            f"name='{self.name}')>"
        )