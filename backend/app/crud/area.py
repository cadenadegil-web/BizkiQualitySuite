from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.area import Area


def get_all(db: Session) -> list[Area]:
    """
    Obtiene todas las áreas.
    """
    stmt = select(Area).order_by(Area.name)
    return list(db.scalars(stmt).all())


def get_active(db: Session) -> list[Area]:
    """
    Obtiene únicamente las áreas activas.
    """
    stmt = (
        select(Area)
        .where(Area.active.is_(True))
        .order_by(Area.name)
    )

    return list(db.scalars(stmt).all())


def get_by_id(db: Session, area_id: UUID) -> Area | None:
    """
    Busca un área por su ID.
    """
    stmt = select(Area).where(Area.id == area_id)
    return db.scalar(stmt)


def get_by_name(db: Session, name: str) -> Area | None:
    """
    Busca un área por nombre.
    """
    stmt = select(Area).where(Area.name == name)
    return db.scalar(stmt)


def create(db: Session, name: str) -> Area:
    """
    Crea una nueva área.
    """
    area = Area(
        name=name,
        active=True,
    )

    db.add(area)
    db.commit()
    db.refresh(area)

    return area


def update(
    db: Session,
    area: Area,
    name: str | None = None,
    active: bool | None = None,
) -> Area:
    """
    Actualiza un área existente.
    """

    if name is not None:
        area.name = name

    if active is not None:
        area.active = active

    db.commit()
    db.refresh(area)

    return area


def delete(db: Session, area: Area) -> None:
    """
    Elimina un área.
    """
    db.delete(area)
    db.commit()