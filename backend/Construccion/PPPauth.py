from datetime import timedelta

from fastapi import APIRouter, HTTPException, status

router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación"]
)


@router.get("/")
def auth_info():
    return {
        "modulo": "Autenticación",
        "estado": "En desarrollo"
    }


@router.post("/login")
def login():
    """
    Este endpoint será implementado en el siguiente paso.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login aún no implementado."
    )