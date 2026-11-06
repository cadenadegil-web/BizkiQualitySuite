import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Management(Base):
    """
    Catálogo de Gerencias (Direcciones / Departamentos).
    Ejemplos: Gestión y Gente, Operaciones, Calidad, Finanzas, Mantenimiento, Producción.
    """

    __tablename__ = "managements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    plant: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Management(id={self.id}, name='{self.name}', plant='{self.plant}')>"
