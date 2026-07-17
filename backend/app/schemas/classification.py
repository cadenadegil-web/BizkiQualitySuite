from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ClassificationBase(BaseModel):
    name: str
    active: bool = True


class ClassificationCreate(ClassificationBase):
    pass


class ClassificationUpdate(BaseModel):
    name: str | None = None
    active: bool | None = None


class ClassificationResponse(ClassificationBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)