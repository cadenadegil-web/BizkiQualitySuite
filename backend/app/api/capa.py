from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.capa import (
    CAPACreate,
    CAPAResponse,
    CAPAUpdate,
)
from app.security.auth import get_current_user
from app.services.capa_service import (
    can_access_capa,
    create_capa,
    delete_capa,
    get_capa,
    get_capas,
    get_capas_by_finding,
    restore_capa,
    update_capa,
)

router = APIRouter(
    prefix="/capas",
    tags=["CAPA"],
)


# =====================================================
# Crear CAPA
# =====================================================

@router.post(
    "/",
    response_model=CAPAResponse,
    status_code=201,
)
def create(
    capa: CAPACreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_capa(
        db=db,
        capa=capa,
    )


# =====================================================
# Listar todas
# =====================================================

@router.get(
    "/",
    response_model=list[CAPAResponse],
)
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_capas(db, current_user=current_user)


# =====================================================
# Obtener una
# =====================================================

@router.get(
    "/{capa_id}",
    response_model=CAPAResponse,
)
def get_one(
    capa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capa = get_capa(
        db,
        capa_id,
    )

    if capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    if not can_access_capa(capa, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver esta acción correctiva.",
        )

    return capa


# =====================================================
# Obtener CAPAs por Hallazgo
# =====================================================

@router.get(
    "/finding/{finding_id}",
    response_model=list[CAPAResponse],
)
def by_finding(
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_capas_by_finding(
        db,
        finding_id,
    )


# =====================================================
# Actualizar
# =====================================================

@router.put(
    "/{capa_id}",
    response_model=CAPAResponse,
)
def update(
    capa_id: UUID,
    data: CAPAUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capa = get_capa(db, capa_id)
    if capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    if not can_access_capa(capa, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar esta acción correctiva.",
        )

    return update_capa(
        db,
        capa_id,
        data,
    )


# =====================================================
# Eliminar
# =====================================================

@router.delete(
    "/{capa_id}",
)
def delete(
    capa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capa = get_capa(db, capa_id)
    if capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    if not can_access_capa(capa, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar esta acción correctiva.",
        )

    delete_capa(
        db,
        capa_id,
    )

    return {
        "message": "CAPA eliminada correctamente."
    }


# =====================================================
# Restaurar
# =====================================================

@router.patch(
    "/restore/{capa_id}",
    response_model=CAPAResponse,
)
def restore(
    capa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capa = get_capa(db, capa_id)
    if capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    if not can_access_capa(capa, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para restaurar esta acción correctiva.",
        )

    return restore_capa(
        db,
        capa_id,
    )