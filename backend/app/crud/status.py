from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.status import Status


def get_all(db: Session) -> list[Status]:
    """
    Obtiene todos los estados.
    """
    stmt = select(Status).order_by(Status.name)
    return list(db.scalars(stmt).all())


def get_active(db: Session) -> list[Status]:
    """
    Obtiene únicamente los estados activos.
    """
    stmt = (
        select(Status)
        .where(Status.active.is_(True))
        .order_by(Status.name)
    )

    return list(db.scalars(stmt).all())


def get_by_id(
    db: Session,
    status_id: UUID,
) -> Status | None:
    """
    Busca un estado por su ID.
    """
    stmt = select(Status).where(
        Status.id == status_id
    )

    return db.scalar(stmt)


def get_by_name(
    db: Session,
    name: str,
) -> Status | None:
    """
    Busca un estado por su nombre.
    """
    stmt = select(Status).where(
        Status.name == name
    )

    return db.scalar(stmt)


def create(
    db: Session,
    name: str,
) -> Status:
    """
    Crea un nuevo estado.
    """
    status = Status(
        name=name,
        active=True,
    )

    db.add(status)
    db.commit()
    db.refresh(status)

    return status


def update(
    db: Session,
    status: Status,
    name: str | None = None,
    active: bool | None = None,
) -> Status:
    """
    Actualiza un estado existente.
    """

    if name is not None:
        status.name = name

    if active is not None:
        status.active = active

    db.commit()
    db.refresh(status)

    return status


def delete(
    db: Session,
    status: Status,
) -> None:
    """
    Elimina un estado.
    """
    db.delete(status)
    db.commit()