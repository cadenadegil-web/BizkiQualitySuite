from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import auth, findings, users
from app.core.config import settings
from app.database.init_db import create_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_database()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(findings.router)


@app.get("/")
def root():
    return {
        "empresa": "Bizcocho Bizki",
        "sistema": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "estado": "Operativo",
    }