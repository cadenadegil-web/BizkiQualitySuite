# app/models/audit.py
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.area import Area
    from app.models.finding import Finding


class Audit(Base):
    """
    Auditoría de proceso BPM/ISO.
    Encabezado que agrupa los ítems del checklist.
    """
    __tablename__ = "audits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    
    # Encabezado
    audit_date: Mapped[date] = mapped_column(Date, nullable=False)
    shift: Mapped[str] = mapped_column(String(20), nullable=False)  # Mañana / Tarde / Noche
    auditor: Mapped[str] = mapped_column(String(150), nullable=False)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Estado
    status: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)  # PENDIENTE / COMPLETADA
    score: Mapped[float | None] = mapped_column(Float, nullable=True)  # % conformes
    
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # FK
    area_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=False)
    
    # Relations
    area: Mapped["Area"] = relationship("Area", back_populates="audits", lazy="joined")
    items: Mapped[list["AuditItem"]] = relationship("AuditItem", back_populates="audit", cascade="all, delete-orphan", lazy="selectin", order_by="AuditItem.order")

    def __repr__(self) -> str:
        return f"<Audit(code='{self.code}', date='{self.audit_date}', status='{self.status}')>"


class AuditItem(Base):
    """
    Ítem del checklist de auditoría.
    Cada ítem representa un punto de control con su norma de referencia.
    """
    __tablename__ = "audit_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # FK a auditoría
    audit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False)
    
    # Punto de control
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    norm: Mapped[str] = mapped_column(String(100), nullable=False)  # ej. "BPM §4.1"
    control_point: Mapped[str] = mapped_column(String(300), nullable=False)
    
    # Resultado
    result: Mapped[str | None] = mapped_column(String(30), nullable=True)  # CONFORME / NO_CONFORME / OBSERVACION
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relation
    audit: Mapped["Audit"] = relationship("Audit", back_populates="items")

    def __repr__(self) -> str:
        return f"<AuditItem(norm='{self.norm}', result='{self.result}')>"
