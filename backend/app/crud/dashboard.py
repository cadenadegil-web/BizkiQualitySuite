from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.models.area import Area
from app.models.classification import Classification
from app.models.finding import Finding
from app.models.status import Status


def get_summary(db: Session) -> dict:

    total_findings = db.scalar(
        select(func.count(Finding.id))
    ) or 0

    open_findings = db.scalar(
        select(func.count(Finding.id))
        .join(Status)
        .where(func.lower(Status.name) == "abierto")
    ) or 0

    closed_findings = db.scalar(
        select(func.count(Finding.id))
        .join(Status)
        .where(func.lower(Status.name) == "cerrado")
    ) or 0

    critical_findings = db.scalar(
        select(func.count(Finding.id))
        .join(Classification)
        .where(func.lower(Classification.name) == "crítico")
    ) or 0

    major_findings = db.scalar(
        select(func.count(Finding.id))
        .join(Classification)
        .where(func.lower(Classification.name) == "mayor")
    ) or 0

    minor_findings = db.scalar(
        select(func.count(Finding.id))
        .join(Classification)
        .where(func.lower(Classification.name) == "menor")
    ) or 0

    return {
        "total_findings": total_findings,
        "open_findings": open_findings,
        "closed_findings": closed_findings,
        "critical_findings": critical_findings,
        "major_findings": major_findings,
        "minor_findings": minor_findings,
    }


def get_findings_by_area(db: Session):

    stmt = (
        select(
            Area.name,
            func.count(Finding.id).label("total"),
        )
        .join(Finding)
        .group_by(Area.name)
        .order_by(func.count(Finding.id).desc())
    )

    return [
        {
            "label": row.name,
            "total": row.total,
        }
        for row in db.execute(stmt)
    ]


def get_findings_by_status(db: Session):

    stmt = (
        select(
            Status.name,
            func.count(Finding.id).label("total"),
        )
        .join(Finding)
        .group_by(Status.name)
        .order_by(func.count(Finding.id).desc())
    )

    return [
        {
            "label": row.name,
            "total": row.total,
        }
        for row in db.execute(stmt)
    ]


def get_findings_by_classification(db: Session):

    stmt = (
        select(
            Classification.name,
            func.count(Finding.id).label("total"),
        )
        .join(Finding)
        .group_by(Classification.name)
        .order_by(func.count(Finding.id).desc())
    )

    return [
        {
            "label": row.name,
            "total": row.total,
        }
        for row in db.execute(stmt)
    ]


def get_recent_findings(
    db: Session,
    limit: int = 10,
):

    stmt = (
        select(Finding)
        .options(
            joinedload(Finding.area),
            joinedload(Finding.classification),
            joinedload(Finding.status),
        )
        .order_by(Finding.created_at.desc())
        .limit(limit)
    )

    findings = db.scalars(stmt).all()

    return [
        {
            "code": finding.code,
            "area": finding.area.name,
            "classification": finding.classification.name,
            "status": finding.status.name,
            "responsible": finding.responsible,
            "process": finding.process,
        }
        for finding in findings
    ]