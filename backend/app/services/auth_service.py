from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.security.jwt import create_access_token
from app.security.password import verify_password


def login(
    db: Session,
    username: str,
    password: str,
):
    """
    Autentica un usuario y genera un JWT.
    """

    user = user_crud.get_by_username(db, username)

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    access_token = create_access_token(
        {
            "sub": user.username,
            "user_id": str(user.id),
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }