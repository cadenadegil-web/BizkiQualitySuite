from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import auth
from app.api import users
from app.api import findings
from app.api import dashboard
from app.api import capa
from app.api import evidence
from app.api import catalogs
from app.api import audits

from app.core.config import settings
from app.database.init_db import create_database
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_database()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Allow CORS from frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Fallback: ensure CORS headers are present on all responses
@app.middleware("http")
async def add_cors_headers(request, call_next):
    origin = request.headers.get("origin", "*")
    
    # Handle preflight
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
        return Response(status_code=200, headers=headers)

    response = await call_next(request)
    response.headers.setdefault("Access-Control-Allow-Origin", origin)
    response.headers.setdefault("Access-Control-Allow-Credentials", "true")
    response.headers.setdefault("Access-Control-Allow-Methods", "*")
    response.headers.setdefault("Access-Control-Allow-Headers", "*")
    return response

# =====================================================
# Routers
# =====================================================

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(findings.router)
app.include_router(dashboard.router)
app.include_router(capa.router)
app.include_router(evidence.router)
app.include_router(catalogs.router)
app.include_router(audits.router)


@app.get("/")
def root():
    return {
        "empresa": "Bizcocho Bizki",
        "sistema": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "estado": "Operativo",
    }