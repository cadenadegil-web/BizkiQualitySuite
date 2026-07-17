from pydantic import BaseModel


class LoginRequest(BaseModel):
    """
    Datos requeridos para iniciar sesión.
    """

    username: str
    password: str