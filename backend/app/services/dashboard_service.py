from sqlalchemy.orm import Session

from app.crud import dashboard as dashboard_crud
from app.models.user import User


def get_dashboard(db: Session, current_user: User | None = None):
    """
    Obtiene toda la información del Dashboard Ejecutivo.
    """

    return {
        "summary": dashboard_crud.get_summary(db, current_user=current_user),
        "by_area": dashboard_crud.get_findings_by_area(db, current_user=current_user),
        "by_status": dashboard_crud.get_findings_by_status(db, current_user=current_user),
        "by_classification": dashboard_crud.get_findings_by_classification(db, current_user=current_user),
        "recent_findings": dashboard_crud.get_recent_findings(db, current_user=current_user),
    }


def get_dashboard_summary(db: Session, current_user: User | None = None):
    return dashboard_crud.get_summary(db, current_user=current_user)


def get_dashboard_by_area(db: Session, current_user: User | None = None):
    return dashboard_crud.get_findings_by_area(db, current_user=current_user)


def get_dashboard_by_status(db: Session, current_user: User | None = None):
    return dashboard_crud.get_findings_by_status(db, current_user=current_user)


def get_dashboard_by_classification(db: Session, current_user: User | None = None):
    return dashboard_crud.get_findings_by_classification(db, current_user=current_user)


def get_recent_findings(
    db: Session,
    limit: int = 10,
    current_user: User | None = None,
):
    return dashboard_crud.get_recent_findings(
        db,
        limit,
        current_user=current_user,
    )