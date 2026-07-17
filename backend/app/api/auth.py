from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import LoginRequest
from app.schemas.token import Token
from app.services.auth_service import login

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)


@router.post(
    "/login",
    response_model=Token,
)
def login_user(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):

    token = login(
        db,
        credentials.username,
        credentials.password,
    )

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos",
        )

    return token