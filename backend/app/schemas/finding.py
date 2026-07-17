from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict


class FindingBase(BaseModel):
    """
    Información base de un hallazgo BPM.
    """

    process: str
    finding_type: str
    description: str
    responsible: str

    area_id: UUID
    classification_id: UUID
    status_id: UUID
    user_id: UUID | None = None

    active: bool = True


class FindingCreate(FindingBase):
    """
    Esquema utilizado para crear un hallazgo.
    """
    pass


class FindingUpdate(BaseModel):
    """
    Esquema utilizado para actualizar un hallazgo.
    """

    process: str | None = None
    finding_type: str | None = None
    description: str | None = None
    responsible: str | None = None

    area_id: UUID | None = None
    classification_id: UUID | None = None
    status_id: UUID | None = None
    user_id: UUID | None = None

    active: bool | None = None


class FindingResponse(FindingBase):
    """
    Respuesta devuelta por la API.
    """

    id: UUID
    code: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )