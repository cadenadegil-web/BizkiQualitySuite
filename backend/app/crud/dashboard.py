from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.area import Area
from app.models.classification import Classification
from app.models.finding import Finding
from app.models.status import Status
from app.models.user import User
from app.security.auth import is_supervisor_or_admin


def _user_finding_filter(current_user: User | None):
    if not current_user or is_supervisor_or_admin(current_user):
        return None
    name_clean = (current_user.full_name or "").strip().lower()
    user_clean = (current_user.username or "").strip().lower()
    filters = [Finding.user_id == current_user.id]
    if name_clean:
        filters.append(func.lower(Finding.responsible) == name_clean)
    if user_clean:
        filters.append(func.lower(Finding.responsible) == user_clean)
    return or_(*filters)


def get_summary(db: Session, current_user: User | None = None) -> dict:
    u_filt = _user_finding_filter(current_user)

    total_stmt = select(func.count(Finding.id)).where(Finding.active.is_(True))
    if u_filt is not None:
        total_stmt = total_stmt.where(u_filt)
    total_findings = db.scalar(total_stmt) or 0

    open_stmt = (
        select(func.count(Finding.id))
        .join(Status)
        .where(Finding.active.is_(True), func.lower(Status.name) == "abierto")
    )
    if u_filt is not None:
        open_stmt = open_stmt.where(u_filt)
    open_findings = db.scalar(open_stmt) or 0

    closed_stmt = (
        select(func.count(Finding.id))
        .join(Status)
        .where(Finding.active.is_(True), func.lower(Status.name) == "cerrado")
    )
    if u_filt is not None:
        closed_stmt = closed_stmt.where(u_filt)
    closed_findings = db.scalar(closed_stmt) or 0

    critical_stmt = (
        select(func.count(Finding.id))
        .join(Classification)
        .where(Finding.active.is_(True), func.lower(Classification.name) == "crítico")
    )
    if u_filt is not None:
        critical_stmt = critical_stmt.where(u_filt)
    critical_findings = db.scalar(critical_stmt) or 0

    major_stmt = (
        select(func.count(Finding.id))
        .join(Classification)
        .where(Finding.active.is_(True), func.lower(Classification.name) == "mayor")
    )
    if u_filt is not None:
        major_stmt = major_stmt.where(u_filt)
    major_findings = db.scalar(major_stmt) or 0

    minor_stmt = (
        select(func.count(Finding.id))
        .join(Classification)
        .where(Finding.active.is_(True), func.lower(Classification.name) == "menor")
    )
    if u_filt is not None:
        minor_stmt = minor_stmt.where(u_filt)
    minor_findings = db.scalar(minor_stmt) or 0

    return {
        "total_findings": total_findings,
        "open_findings": open_findings,
        "closed_findings": closed_findings,
        "critical_findings": critical_findings,
        "major_findings": major_findings,
        "minor_findings": minor_findings,
    }


def get_findings_by_area(db: Session, current_user: User | None = None):
    u_filt = _user_finding_filter(current_user)

    stmt = (
        select(
            Area.name,
            func.count(Finding.id).label("total"),
        )
        .join(Finding)
        .where(Finding.active.is_(True))
    )
    if u_filt is not None:
        stmt = stmt.where(u_filt)

    stmt = (
        stmt
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


def get_findings_by_status(db: Session, current_user: User | None = None):
    u_filt = _user_finding_filter(current_user)

    stmt = (
        select(
            Status.name,
            func.count(Finding.id).label("total"),
        )
        .join(Finding)
        .where(Finding.active.is_(True))
    )
    if u_filt is not None:
        stmt = stmt.where(u_filt)

    stmt = (
        stmt
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


def get_findings_by_classification(db: Session, current_user: User | None = None):
    u_filt = _user_finding_filter(current_user)

    stmt = (
        select(
            Classification.name,
            func.count(Finding.id).label("total"),
        )
        .join(Finding)
        .where(Finding.active.is_(True))
    )
    if u_filt is not None:
        stmt = stmt.where(u_filt)

    stmt = (
        stmt
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
    current_user: User | None = None,
):
    u_filt = _user_finding_filter(current_user)

    stmt = (
        select(Finding)
        .options(
            joinedload(Finding.area),
            joinedload(Finding.classification),
            joinedload(Finding.status),
        )
        .where(Finding.active.is_(True))
    )
    if u_filt is not None:
        stmt = stmt.where(u_filt)

    stmt = stmt.order_by(Finding.created_at.desc()).limit(limit)

    findings = db.scalars(stmt).all()

    return [
        {
            "code": finding.code,
            "area": finding.area.name if finding.area else "N/A",
            "classification": finding.classification.name if finding.classification else "N/A",
            "status": finding.status.name if finding.status else "N/A",
            "responsible": finding.responsible,
            "process": finding.process,
        }
        for finding in findings
    ]