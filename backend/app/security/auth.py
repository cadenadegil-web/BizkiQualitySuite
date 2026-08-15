from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.database.session import get_db
from app.models.user import User
from app.security.jwt import decode_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado.",
        )

    username = payload.get("sub")
    user_id = payload.get("user_id")
    role = payload.get("role")

    if not username or not user_id or not role:
        raise HTTPException(
            status_code=401,
            detail="Token incompleto.",
        )

    user = user_crud.get_by_username(db, username)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Usuario inválido o inactivo.",
        )

    return user


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    role = current_user.role.lower()

    if role not in {"administrador", "admin"}:
        raise HTTPException(
            status_code=403,
            detail="Permiso denegado. Se requiere rol de administrador.",
        )

    return current_user
