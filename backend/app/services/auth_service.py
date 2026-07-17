from sqlalchemy.orm import Session

from app.models.user import User
from app.security.jwt_handler import create_access_token
from app.security.password import verify_password


def login(db: Session, username: str, password: str):

    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    access_token = create_access_token(
        {
            "sub": user.username,
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }