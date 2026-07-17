from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.models.finding import Finding


def get_all(db: Session) -> list[Finding]:
    """
    Obtiene todos los hallazgos con sus relaciones.
    """
    stmt = (
        select(Finding)
        .options(
            joinedload(Finding.area),
            joinedload(Finding.classification),
            joinedload(Finding.status),
            joinedload(Finding.user),
        )
        .order_by(Finding.created_at.desc())
    )

    return list(db.scalars(stmt).all())


def get_active(db: Session) -> list[Finding]:
    """
    Obtiene únicamente los hallazgos activos.
    """
    stmt = (
        select(Finding)
        .options(
            joinedload(Finding.area),
            joinedload(Finding.classification),
            joinedload(Finding.status),
            joinedload(Finding.user),
        )
        .where(Finding.active.is_(True))
        .order_by(Finding.created_at.desc())
    )

    return list(db.scalars(stmt).all())


def get_by_id(
    db: Session,
    finding_id: UUID,
) -> Finding | None:
    """
    Busca un hallazgo por ID.
    """
    stmt = (
        select(Finding)
        .options(
            joinedload(Finding.area),
            joinedload(Finding.classification),
            joinedload(Finding.status),
            joinedload(Finding.user),
        )
        .where(Finding.id == finding_id)
    )

    return db.scalar(stmt)


def get_by_code(
    db: Session,
    code: str,
) -> Finding | None:
    """
    Busca un hallazgo por código.
    """
    stmt = (
        select(Finding)
        .options(
            joinedload(Finding.area),
            joinedload(Finding.classification),
            joinedload(Finding.status),
            joinedload(Finding.user),
        )
        .where(Finding.code == code)
    )

    return db.scalar(stmt)


def create(
    db: Session,
    code: str,
    process: str,
    finding_type: str,
    description: str,
    responsible: str,
    area_id: UUID,
    classification_id: UUID,
    status_id: UUID,
    user_id: UUID | None = None,
) -> Finding:
    """
    Crea un nuevo hallazgo.
    """

    finding = Finding(
        code=code,
        process=process,
        finding_type=finding_type,
        description=description,
        responsible=responsible,
        area_id=area_id,
        classification_id=classification_id,
        status_id=status_id,
        user_id=user_id,
        active=True,
    )

    db.add(finding)
    db.commit()
    db.refresh(finding)

    return finding


def update(
    db: Session,
    finding: Finding,
    process: str | None = None,
    finding_type: str | None = None,
    description: str | None = None,
    responsible: str | None = None,
    area_id: UUID | None = None,
    classification_id: UUID | None = None,
    status_id: UUID | None = None,
    user_id: UUID | None = None,
    active: bool | None = None,
) -> Finding:
    """
    Actualiza un hallazgo.
    """

    if process is not None:
        finding.process = process

    if finding_type is not None:
        finding.finding_type = finding_type

    if description is not None:
        finding.description = description

    if responsible is not None:
        finding.responsible = responsible

    if area_id is not None:
        finding.area_id = area_id

    if classification_id is not None:
        finding.classification_id = classification_id

    if status_id is not None:
        finding.status_id = status_id

    if user_id is not None:
        finding.user_id = user_id

    if active is not None:
        finding.active = active

    db.commit()
    db.refresh(finding)

    return finding


def delete(
    db: Session,
    finding: Finding,
) -> None:
    """
    Elimina un hallazgo.
    """
    db.delete(finding)
    db.commit()