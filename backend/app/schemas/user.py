from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr


class UserBase(BaseModel):
    """
    Información base del usuario.
    """

    full_name: str
    username: str
    email: EmailStr
    role: str
    is_active: bool = True


class UserCreate(UserBase):
    """
    Esquema utilizado para crear un usuario.
    """

    password: str


class UserUpdate(BaseModel):
    """
    Esquema utilizado para actualizar un usuario.
    """

    full_name: str | None = None
    username: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    password: str | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    """
    Esquema utilizado para responder desde la API.
    """

    id: UUID
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )