from sqlalchemy.orm import Session

from app.crud import dashboard as dashboard_crud


def get_dashboard(db: Session):
    """
    Obtiene toda la información del Dashboard Ejecutivo.
    """

    return {
        "summary": dashboard_crud.get_summary(db),
        "by_area": dashboard_crud.get_findings_by_area(db),
        "by_status": dashboard_crud.get_findings_by_status(db),
        "by_classification": dashboard_crud.get_findings_by_classification(db),
        "recent_findings": dashboard_crud.get_recent_findings(db),
    }


def get_dashboard_summary(db: Session):
    return dashboard_crud.get_summary(db)


def get_dashboard_by_area(db: Session):
    return dashboard_crud.get_findings_by_area(db)


def get_dashboard_by_status(db: Session):
    return dashboard_crud.get_findings_by_status(db)


def get_dashboard_by_classification(db: Session):
    return dashboard_crud.get_findings_by_classification(db)


def get_recent_findings(
    db: Session,
    limit: int = 10,
):
    return dashboard_crud.get_recent_findings(
        db,
        limit,
    )