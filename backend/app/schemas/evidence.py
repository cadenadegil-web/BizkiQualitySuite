from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict


# =====================================================
# Base
# =====================================================

class EvidenceBase(BaseModel):
    original_name: str
    mime_type: str
    extension: str
    file_size: int


# =====================================================
# Crear evidencia
# =====================================================

class EvidenceCreate(EvidenceBase):
    finding_id: UUID | None = None
    capa_id: UUID | None = None


# =====================================================
# Actualizar evidencia
# =====================================================

class EvidenceUpdate(BaseModel):
    active: bool | None = None


# =====================================================
# Respuesta
# =====================================================

class EvidenceResponse(EvidenceBase):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID

    finding_id: UUID | None = None
    capa_id: UUID | None = None

    uploaded_by: UUID | None = None

    stored_name: str
    storage_path: str

    active: bool

    created_at: datetime


# =====================================================
# Listado
# =====================================================

class EvidenceList(BaseModel):

    total: int

    items: list[EvidenceResponse]