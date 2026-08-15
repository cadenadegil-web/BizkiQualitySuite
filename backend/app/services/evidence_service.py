from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.crud.evidence import (
    create_evidence,
    delete_evidence,
    get_all_evidences,
    get_evidence,
    get_evidences_by_capa,
    get_evidences_by_finding,
)
from app.models.capa import CAPA
from app.models.finding import Finding
from app.schemas.evidence import EvidenceCreate
from app.utils.file_storage import (
    delete_file,
    file_exists,
    get_extension,
    get_file_size,
    save_file,
)


# =====================================================
# Función privada para almacenar evidencia
# =====================================================

def _store_evidence(
    db: Session,
    *,
    file: UploadFile,
    folder: str,
    finding_id: UUID | None = None,
    capa_id: UUID | None = None,
    uploaded_by: UUID | None = None,
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Debe seleccionar un archivo.",
        )

    stored_name = None
    storage_path = None

    try:

        stored_name, storage_path = save_file(
            file,
            folder,
        )

        evidence = EvidenceCreate(
            finding_id=finding_id,
            capa_id=capa_id,
            original_name=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            extension=get_extension(file.filename),
            file_size=get_file_size(storage_path),
        )

        return create_evidence(
            db=db,
            evidence=evidence,
            stored_name=stored_name,
            storage_path=storage_path,
            uploaded_by=uploaded_by,
        )

    except Exception:

        if storage_path and file_exists(storage_path):
            delete_file(storage_path)

        raise


# =====================================================
# Upload Hallazgo
# =====================================================

def upload_finding_evidence(
    db: Session,
    finding_id: UUID,
    file: UploadFile,
    uploaded_by: UUID | None = None,
):

    finding = (
        db.query(Finding)
        .filter(Finding.id == finding_id)
        .first()
    )

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado.",
        )

    return _store_evidence(
        db=db,
        file=file,
        folder="findings",
        finding_id=finding_id,
        uploaded_by=uploaded_by,
    )


# =====================================================
# Upload CAPA
# =====================================================

def upload_capa_evidence(
    db: Session,
    capa_id: UUID,
    file: UploadFile,
    uploaded_by: UUID | None = None,
):

    capa = (
        db.query(CAPA)
        .filter(CAPA.id == capa_id)
        .first()
    )

    if capa is None:
        raise HTTPException(
            status_code=404,
            detail="CAPA no encontrada.",
        )

    return _store_evidence(
        db=db,
        file=file,
        folder="capas",
        capa_id=capa_id,
        uploaded_by=uploaded_by,
    )


# =====================================================
# Listar todas
# =====================================================

def list_evidences(
    db: Session,
):
    return get_all_evidences(db)


# =====================================================
# Evidencias por Hallazgo
# =====================================================

def list_finding_evidences(
    db: Session,
    finding_id: UUID,
):
    return get_evidences_by_finding(
        db,
        finding_id,
    )


# =====================================================
# Evidencias por CAPA
# =====================================================

def list_capa_evidences(
    db: Session,
    capa_id: UUID,
):
    return get_evidences_by_capa(
        db,
        capa_id,
    )


# =====================================================
# Obtener una evidencia
# =====================================================

def get_one_evidence(
    db: Session,
    evidence_id: UUID,
):

    evidence = get_evidence(
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
# Descargar
# =====================================================

def download_evidence(
    db: Session,
    evidence_id: UUID,
):

    evidence = get_one_evidence(
        db,
        evidence_id,
    )

    if not file_exists(
        evidence.storage_path,
    ):
        raise HTTPException(
            status_code=404,
            detail="El archivo físico no existe.",
        )

    return FileResponse(
        path=evidence.storage_path,
        filename=evidence.original_name,
        media_type=evidence.mime_type,
    )


# =====================================================
# Vista previa
# =====================================================

def preview_evidence(
    db: Session,
    evidence_id: UUID,
):

    evidence = get_one_evidence(
        db,
        evidence_id,
    )

    if not file_exists(
        evidence.storage_path,
    ):
        raise HTTPException(
            status_code=404,
            detail="Archivo no encontrado.",
        )

    return FileResponse(
        path=evidence.storage_path,
        media_type=evidence.mime_type,
    )


# =====================================================
# Información
# =====================================================

def get_file_information(
    db: Session,
    evidence_id: UUID,
):

    evidence = get_one_evidence(
        db,
        evidence_id,
    )

    return {
        "id": evidence.id,
        "name": evidence.original_name,
        "mime": evidence.mime_type,
        "extension": evidence.extension,
        "size": evidence.file_size,
        "path": evidence.storage_path,
        "exists": Path(
            evidence.storage_path
        ).exists(),
    }


# =====================================================
# Eliminar
# =====================================================

def remove_evidence(
    db: Session,
    evidence_id: UUID,
):

    evidence = get_one_evidence(
        db,
        evidence_id,
    )

    if file_exists(
        evidence.storage_path,
    ):
        delete_file(
            evidence.storage_path,
        )

    return delete_evidence(
        db,
        evidence_id,
    )