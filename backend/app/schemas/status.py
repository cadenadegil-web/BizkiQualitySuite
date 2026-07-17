from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict


class StatusBase(BaseModel):
    """
    Esquema base para los estados de un hallazgo.
    """

    name: str
    active: bool = True


class StatusCreate(StatusBase):
    """
    Esquema utilizado para crear un estado.
    """
    pass


class StatusUpdate(BaseModel):
    """
    Esquema utilizado para actualizar un estado.
    """

    name: str | None = None
    active: bool | None = None


class StatusResponse(StatusBase):
    """
    Esquema utilizado en las respuestas de la API.
    """

    id: UUID

    model_config = ConfigDict(
        from_attributes=True
    )