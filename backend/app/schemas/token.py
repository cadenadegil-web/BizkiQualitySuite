from pydantic import BaseModel


class Token(BaseModel):
    """
    Token JWT devuelto por la API.
    """

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """
    Información contenida dentro del JWT.
    """

    username: str | None = None