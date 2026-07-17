from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FindingBase(BaseModel):
    area: str
    process: str
    finding_type: str
    classification: str
    description: str
    responsible: str


class FindingCreate(FindingBase):
    pass


class FindingUpdate(BaseModel):
    area: str | None = None
    process: str | None = None
    finding_type: str | None = None
    classification: str | None = None
    description: str | None = None
    responsible: str | None = None
    status: str | None = None


class FindingResponse(FindingBase):
    id: UUID
    code: str
    status: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True