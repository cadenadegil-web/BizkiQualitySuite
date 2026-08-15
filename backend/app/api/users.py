from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.security.auth import get_current_admin_user
from app.services.user_service import (
    create_user,
    get_users,
    update_user,
    delete_user,
)

router = APIRouter(
    prefix="/users",
    tags=["Usuarios"],
)


@router.post(
    "/",
    response_model=UserResponse,
)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin_user),
):
    try:
        return create_user(db, user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[UserResponse],
)
def list_users(
    db: Session = Depends(get_db),
):
    return get_users(db)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_existing_user(
    user_id: UUID,
    user: UserUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin_user),
):
    try:
        return update_user(db, user_id, user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{user_id}",
)
def delete_existing_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin_user),
):
    try:
        delete_user(db, user_id)
        return {"message": "Usuario eliminado correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )