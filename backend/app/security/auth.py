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


SUPERVISOR_ADMIN_ROLES = {
    "administrador",
    "admin",
    "coordinador de calidad",
    "coordinador",
    "supervisor de calidad",
    "supervisora",
    "supervisor",
    "supervisor de producción",
}


def is_supervisor_or_admin(user: User) -> bool:
    """
    Retorna True si el usuario tiene un rol con privilegios de supervisión
    o administración para ver todos los registros del sistema.
    """
    if not user or not user.role:
        return False
    return (user.role or "").strip().lower() in SUPERVISOR_ADMIN_ROLES


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not is_supervisor_or_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail="Permiso denegado. Se requiere rol de administrador, coordinador o supervisor.",
        )

    return current_user
