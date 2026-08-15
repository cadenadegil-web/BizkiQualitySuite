from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict


# =====================================================
# Base
# =====================================================

class CAPABase(BaseModel):

    finding_id: UUID

    title: str

    description: str

    action_type: str

    priority: str = "Media"

    responsible: str

    target_date: date

    completion_date: date | None = None

    effectiveness_review: str | None = None

    effectiveness_date: date | None = None

    status: str = "ABIERTA"

    comments: str | None = None


# =====================================================
# Crear
# =====================================================

class CAPACreate(CAPABase):
    pass


# =====================================================
# Actualizar
# =====================================================

class CAPAUpdate(BaseModel):

    title: str | None = None

    description: str | None = None

    action_type: str | None = None

    priority: str | None = None

    responsible: str | None = None

    target_date: date | None = None

    completion_date: date | None = None

    effectiveness_review: str | None = None

    effectiveness_date: date | None = None

    status: str | None = None

    comments: str | None = None

    active: bool | None = None


# =====================================================
# Respuesta
# =====================================================

class CAPAResponse(CAPABase):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID

    code: str

    active: bool

    created_at: datetime

    updated_at: datetime


# =====================================================
# Listado
# =====================================================

class CAPAList(BaseModel):

    total: int

    items: list[CAPAResponse]