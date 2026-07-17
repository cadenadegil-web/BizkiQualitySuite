from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.classification import Classification


def get_all(db: Session) -> list[Classification]:
    """
    Obtiene todas las clasificaciones.
    """
    stmt = select(Classification).order_by(Classification.name)
    return list(db.scalars(stmt).all())


def get_active(db: Session) -> list[Classification]:
    """
    Obtiene únicamente las clasificaciones activas.
    """
    stmt = (
        select(Classification)
        .where(Classification.active.is_(True))
        .order_by(Classification.name)
    )

    return list(db.scalars(stmt).all())


def get_by_id(
    db: Session,
    classification_id: UUID,
) -> Classification | None:
    """
    Busca una clasificación por su ID.
    """
    stmt = select(Classification).where(
        Classification.id == classification_id
    )

    return db.scalar(stmt)


def get_by_name(
    db: Session,
    name: str,
) -> Classification | None:
    """
    Busca una clasificación por su nombre.
    """
    stmt = select(Classification).where(
        Classification.name == name
    )

    return db.scalar(stmt)


def create(
    db: Session,
    name: str,
) -> Classification:
    """
    Crea una nueva clasificación.
    """
    classification = Classification(
        name=name,
        active=True,
    )

    db.add(classification)
    db.commit()
    db.refresh(classification)

    return classification


def update(
    db: Session,
    classification: Classification,
    name: str | None = None,
    active: bool | None = None,
) -> Classification:
    """
    Actualiza una clasificación existente.
    """

    if name is not None:
        classification.name = name

    if active is not None:
        classification.active = active

    db.commit()
    db.refresh(classification)

    return classification


def delete(
    db: Session,
    classification: Classification,
) -> None:
    """
    Elimina una clasificación.
    """
    db.delete(classification)
    db.commit()