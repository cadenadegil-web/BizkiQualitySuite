from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str
    APP_VERSION: str

    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "bizki_quality"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = ""
    DATABASE_URL: str | None = None

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()