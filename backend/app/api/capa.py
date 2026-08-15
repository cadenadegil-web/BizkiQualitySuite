from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.capa import (
    CAPACreate,
    CAPAResponse,
    CAPAUpdate,
)
from app.services.capa_service import (
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
):

    return get_capas(db)


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
):

    capa = update_capa(
        db,
        capa_id,
        data,
    )

    if capa is None:

        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    return capa


# =====================================================
# Eliminar
# =====================================================

@router.delete(
    "/{capa_id}",
)
def delete(
    capa_id: UUID,
    db: Session = Depends(get_db),
):

    capa = delete_capa(
        db,
        capa_id,
    )

    if capa is None:

        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
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
):

    capa = restore_capa(
        db,
        capa_id,
    )

    if capa is None:

        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    return capa