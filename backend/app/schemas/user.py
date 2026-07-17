from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role: str


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)