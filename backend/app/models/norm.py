import uuid
from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Norm(Base):
    """
    Catálogo de Normas y Puntos de Control.
    Representa una sugerencia de punto de control asociada a una normativa (ej. BPM, ISO).
    """
    __tablename__ = "norms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<Norm(name='{self.name}', active={self.active})>"
