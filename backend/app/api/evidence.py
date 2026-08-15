from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import HTTPException
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.evidence import EvidenceResponse
from app.services.evidence_service import (
    download_evidence,
    get_file_information,
    get_one_evidence,
    list_capa_evidences,
    list_evidences,
    list_finding_evidences,
    preview_evidence,
    remove_evidence,
    upload_capa_evidence,
    upload_finding_evidence,
)

router = APIRouter(
    prefix="/evidences",
    tags=["Evidencias"],
)

# =====================================================
# Upload Evidencia para Hallazgo
# =====================================================

@router.post(
    "/upload/finding/{finding_id}",
    response_model=EvidenceResponse,
)
def upload_to_finding(
    finding_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    evidence = upload_finding_evidence(
        db=db,
        finding_id=finding_id,
        file=file,
    )

    if evidence is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado.",
        )

    return evidence


# =====================================================
# Upload Evidencia para CAPA
# =====================================================

@router.post(
    "/upload/capa/{capa_id}",
    response_model=EvidenceResponse,
)
def upload_to_capa(
    capa_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    evidence = upload_capa_evidence(
        db=db,
        capa_id=capa_id,
        file=file,
    )

    if evidence is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    return evidence


# =====================================================
# Obtener todas las evidencias
# =====================================================

@router.get(
    "/",
    response_model=list[EvidenceResponse],
)
def get_all(
    db: Session = Depends(get_db),
):
    return list_evidences(db)


# =====================================================
# Obtener una evidencia
# =====================================================

@router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse,
)
def get_one(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):

    evidence = get_one_evidence(
        db,
        evidence_id,
    )

    if evidence is None:
        raise HTTPException(
            status_code=404,
            detail="Evidencia no encontrada.",
        )

    return evidence


# =====================================================
# Evidencias por Hallazgo
# =====================================================

@router.get(
    "/finding/{finding_id}",
    response_model=list[EvidenceResponse],
)
def get_by_finding(
    finding_id: UUID,
    db: Session = Depends(get_db),
):

    return list_finding_evidences(
        db,
        finding_id,
    )


# =====================================================
# Evidencias por CAPA
# =====================================================

@router.get(
    "/capa/{capa_id}",
    response_model=list[EvidenceResponse],
)
def get_by_capa(
    capa_id: UUID,
    db: Session = Depends(get_db),
):

    return list_capa_evidences(
        db,
        capa_id,
    )


# =====================================================
# Vista previa del archivo
# =====================================================

@router.get(
    "/preview/{evidence_id}",
)
def preview(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):

    response = preview_evidence(
        db,
        evidence_id,
    )

    if response is None:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado.",
        )

    return response


# =====================================================
# Descargar archivo
# =====================================================

@router.get(
    "/download/{evidence_id}",
)
def download(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):

    response = download_evidence(
        db,
        evidence_id,
    )

    if response is None:
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado.",
        )

    return response


# =====================================================
# Información del archivo
# =====================================================

@router.get(
    "/info/{evidence_id}",
)
def information(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):

    info = get_file_information(
        db,
        evidence_id,
    )

    if info is None:
        raise HTTPException(
            status_code=404,
            detail="Evidencia no encontrada.",
        )

    return info


# =====================================================
# Eliminar evidencia
# =====================================================

@router.delete(
    "/{evidence_id}",
)
def delete(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):

    deleted = remove_evidence(
        db,
        evidence_id,
    )

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Evidencia no encontrada.",
        )

    return {
        "message": "Evidencia eliminada correctamente."
    }