from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.schemas.user import UserCreate
from app.security.password import hash_password


def create_user(db: Session, user: UserCreate):
    """
    Crea un nuevo usuario.
    """

    # Validar username existente
    if user_crud.get_by_username(db, user.username):
        raise ValueError("El nombre de usuario ya existe.")

    # Validar email existente
    if user_crud.get_by_email(db, user.email):
        raise ValueError("El correo electrónico ya existe.")

    return user_crud.create(
        db=db,
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
    )


def get_users(db: Session):
    """
    Obtiene todos los usuarios.
    """
    return user_crud.get_all(db)


def get_active_users(db: Session):
    """
    Obtiene únicamente los usuarios activos.
    """
    return user_crud.get_active(db)


def update_user(db: Session, user_id, user_data):
    """
    Actualiza un usuario existente por su ID.
    """
    user = user_crud.get_by_id(db, user_id)
    if not user:
        raise ValueError("Usuario no encontrado.")

    # Validar si nuevo username pertenece a otro usuario
    if user_data.username and user_data.username.lower() != user.username.lower():
        if user_crud.get_by_username(db, user_data.username):
            raise ValueError("El nombre de usuario ya existe.")

    # Validar si nuevo email pertenece a otro usuario
    if user_data.email and user_data.email != user.email:
        if user_crud.get_by_email(db, user_data.email):
            raise ValueError("El correo electrónico ya existe.")

    password_hash = hash_password(user_data.password) if user_data.password else None

    return user_crud.update(
        db=db,
        user=user,
        full_name=user_data.full_name,
        username=user_data.username,
        email=user_data.email,
        password_hash=password_hash,
        role=user_data.role,
        is_active=user_data.is_active,
    )


def delete_user(db: Session, user_id):
    """
    Elimina un usuario por su ID.
    """
    user = user_crud.get_by_id(db, user_id)
    if not user:
        raise ValueError("Usuario no encontrado.")

    user_crud.delete(db, user)
    return True