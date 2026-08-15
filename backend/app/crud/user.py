from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User


def get_all(db: Session) -> list[User]:
    """
    Obtiene todos los usuarios.
    """
    stmt = select(User).order_by(User.full_name)
    return list(db.scalars(stmt).all())


def get_active(db: Session) -> list[User]:
    """
    Obtiene únicamente los usuarios activos.
    """
    stmt = (
        select(User)
        .where(User.is_active.is_(True))
        .order_by(User.full_name)
    )

    return list(db.scalars(stmt).all())


def get_by_id(
    db: Session,
    user_id: UUID,
) -> User | None:
    """
    Busca un usuario por su ID.
    """
    stmt = select(User).where(User.id == user_id)
    return db.scalar(stmt)


def get_by_username(
    db: Session,
    username: str,
) -> User | None:
    """
    Busca un usuario por su nombre de usuario.
    """
    # Compare case-insensitively to avoid mismatches due to casing
    stmt = select(User).where(func.lower(User.username) == username.lower())
    return db.scalar(stmt)


def get_by_email(
    db: Session,
    email: str,
) -> User | None:
    """
    Busca un usuario por su correo electrónico.
    """
    stmt = select(User).where(User.email == email)
    return db.scalar(stmt)


def create(
    db: Session,
    full_name: str,
    username: str,
    email: str,
    password_hash: str,
    role: str,
) -> User:
    """
    Crea un nuevo usuario.
    """
    user = User(
        full_name=full_name,
        username=username,
        email=email,
        password_hash=password_hash,
        role=role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update(
    db: Session,
    user: User,
    full_name: str | None = None,
    username: str | None = None,
    email: str | None = None,
    password_hash: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
) -> User:
    """
    Actualiza un usuario existente.
    """

    if full_name is not None:
        user.full_name = full_name

    if username is not None:
        user.username = username

    if email is not None:
        user.email = email

    if password_hash is not None:
        user.password_hash = password_hash

    if role is not None:
        user.role = role

    if is_active is not None:
        user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user


def delete(
    db: Session,
    user: User,
) -> None:
    """
    Elimina un usuario.
    """
    db.delete(user)
    db.commit()