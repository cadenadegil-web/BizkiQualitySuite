from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict

from app.schemas.area import AreaResponse
from app.schemas.classification import ClassificationResponse
from app.schemas.status import StatusResponse


class FindingBase(BaseModel):
    """
    Información base de un hallazgo BPM.
    """

    process: str
    finding_type: str
    description: str
    responsible: str

    area_id: UUID | None = None
    classification_id: UUID | None = None
    status_id: UUID | None = None
    user_id: UUID | None = None

    active: bool = True
    created_at: datetime | None = None


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
    created_at: datetime | None = None


class FindingResponse(FindingBase):
    """
    Respuesta devuelta por la API.
    Incluye los objetos de catálogo anidados (area, classification, status)
    para que el frontend pueda mostrar los nombres sin consultas adicionales.
    """

    id: UUID
    code: str
    created_at: datetime

    # Relaciones ORM serializadas como objetos anidados
    area: AreaResponse | None = None
    classification: ClassificationResponse | None = None
    status: StatusResponse | None = None

    model_config = ConfigDict(
        from_attributes=True
    )