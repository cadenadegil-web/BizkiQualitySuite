from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dashboard import DashboardResponse, DashboardSummary
from app.services.dashboard_service import (
    get_dashboard,
    get_dashboard_summary,
    get_dashboard_by_area,
    get_dashboard_by_status,
    get_dashboard_by_classification,
    get_recent_findings,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/",
    response_model=DashboardResponse,
)
def dashboard(
    db: Session = Depends(get_db),
):
    """
    Dashboard Ejecutivo.
    """
    return get_dashboard(db)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def summary(
    db: Session = Depends(get_db),
):
    return get_dashboard_summary(db)


@router.get("/areas")
def areas(
    db: Session = Depends(get_db),
):
    return get_dashboard_by_area(db)


@router.get("/status")
def status(
    db: Session = Depends(get_db),
):
    return get_dashboard_by_status(db)


@router.get("/classifications")
def classifications(
    db: Session = Depends(get_db),
):
    return get_dashboard_by_classification(db)


@router.get("/recent")
def recent(
    limit: int = 10,
    db: Session = Depends(get_db),
):
    return get_recent_findings(db, limit)