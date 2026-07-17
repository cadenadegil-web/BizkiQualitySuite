from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AreaBase(BaseModel):
    name: str
    active: bool = True


class AreaCreate(AreaBase):
    pass


class AreaUpdate(BaseModel):
    name: str | None = None
    active: bool | None = None


class AreaResponse(AreaBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)