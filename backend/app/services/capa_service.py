from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.capa import (
    create_capa as crud_create_capa,
    delete_capa as crud_delete_capa,
    get_all_capas,
    get_capa as crud_get_capa,
    get_capas_by_finding as crud_get_capas_by_finding,
    restore_capa as crud_restore_capa,
    update_capa as crud_update_capa,
)

from app.models.capa import CAPA
from app.schemas.capa import (
    CAPACreate,
    CAPAUpdate,
)


# =====================================================
# Generar código CAPA
# =====================================================

def generate_code(
    db: Session,
) -> str:
    """
    Genera un código tipo:

        CAPA-2026-000001
    """

    year = datetime.now().year

    total = (
        db.query(func.count(CAPA.id))
        .scalar()
        or 0
    )

    sequence = total + 1

    return f"CAPA-{year}-{sequence:06}"


# =====================================================
# Crear
# =====================================================

def create_capa(
    db: Session,
    capa: CAPACreate,
):

    code = generate_code(db)

    return crud_create_capa(
        db=db,
        capa=capa,
        code=code,
    )


# =====================================================
# Obtener todas
# =====================================================

def get_capas(
    db: Session,
):

    return get_all_capas(db)


# =====================================================
# Obtener una
# =====================================================

def get_capa(
    db: Session,
    capa_id,
):

    return crud_get_capa(
        db,
        capa_id,
    )


# =====================================================
# Obtener por Hallazgo
# =====================================================

def get_capas_by_finding(
    db: Session,
    finding_id,
):

    return crud_get_capas_by_finding(
        db,
        finding_id,
    )


# =====================================================
# Actualizar
# =====================================================

def update_capa(
    db: Session,
    capa_id,
    data: CAPAUpdate,
):

    return crud_update_capa(
        db,
        capa_id,
        data,
    )


# =====================================================
# Eliminar
# =====================================================

def delete_capa(
    db: Session,
    capa_id,
):

    return crud_delete_capa(
        db,
        capa_id,
    )


# =====================================================
# Restaurar
# =====================================================

def restore_capa(
    db: Session,
    capa_id,
):

    return crud_restore_capa(
        db,
        capa_id,
    )