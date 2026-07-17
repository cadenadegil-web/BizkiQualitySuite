from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str
    APP_VERSION: str

    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_PASSWORD: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    class Config:
        env_file = ".env"


settings = Settings()