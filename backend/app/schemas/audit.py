from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from app.schemas.area import AreaResponse


RESULT_CHOICES = ["CONFORME", "NO_CONFORME", "OBSERVACION"]
SHIFT_CHOICES = ["Mañana", "Tarde", "Noche"]


class AuditItemBase(BaseModel):
    order: int = 1
    norm: str
    control_point: str
    result: Optional[str] = None  # CONFORME / NO_CONFORME / OBSERVACION
    comment: Optional[str] = None


class AuditItemCreate(AuditItemBase):
    pass


class AuditItemUpdate(BaseModel):
    result: Optional[str] = None
    comment: Optional[str] = None


class AuditItemResponse(AuditItemBase):
    id: UUID
    audit_id: UUID
    model_config = ConfigDict(from_attributes=True)


class AuditBase(BaseModel):
    audit_date: date
    shift: str
    auditor: str
    observations: Optional[str] = None
    area_id: UUID


class AuditCreate(AuditBase):
    items: list[AuditItemCreate] = Field(default_factory=list)


class AuditUpdate(BaseModel):
    audit_date: Optional[date] = None
    shift: Optional[str] = None
    auditor: Optional[str] = None
    observations: Optional[str] = None
    area_id: Optional[UUID] = None
    items: Optional[list[AuditItemCreate]] = None


class AuditResponse(AuditBase):
    id: UUID
    code: str
    status: str
    score: Optional[float] = None
    active: bool
    created_at: datetime
    updated_at: datetime
    area: Optional[AreaResponse] = None
    items: list[AuditItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
