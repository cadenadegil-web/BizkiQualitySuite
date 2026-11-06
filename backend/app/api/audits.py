import mimetypes
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.area import Area
from app.models.user import User
from app.schemas.audit import AuditCreate, AuditResponse, AuditUpdate
from app.security.auth import get_current_user
from app.utils.file_storage import BASE_STORAGE, save_file
from app.services.audit_service import (
    can_access_audit, complete_audit, create_audit, delete_audit,
    get_audit, get_audits, get_audits_by_date, get_audits_for_report, update_audit,
)
from app.services.audit_report_service import (
    generate_audit_pdf, generate_daily_report_pdf,
)

router = APIRouter(prefix="/audits", tags=["Auditorías"])


@router.post("/", response_model=AuditResponse)
def create(
    data: AuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_audit(db, data, current_user=current_user)


@router.get("/", response_model=list[AuditResponse])
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_audits(db, current_user=current_user)


@router.get("/reports/daily")
def daily_report(
    report_date: date | None = Query(default=None, description="Fecha única YYYY-MM-DD"),
    start_date: date | None = Query(default=None, description="Fecha inicio YYYY-MM-DD"),
    end_date: date | None = Query(default=None, description="Fecha fin YYYY-MM-DD"),
    area_id: UUID | None = Query(default=None, description="ID del Área (opcional)"),
    plant: str | None = Query(default=None, description="Nombre de la Planta (opcional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s_date = start_date or report_date or date.today()
    e_date = end_date or start_date or report_date or date.today()
    if s_date > e_date:
        s_date, e_date = e_date, s_date

    area_name: str | None = None
    if area_id:
        area_obj = db.query(Area).filter(Area.id == area_id).first()
        if area_obj:
            area_name = area_obj.name

    audits = get_audits_for_report(
        db,
        start_date=s_date,
        end_date=e_date,
        area_id=area_id,
        plant=plant,
        current_user=current_user,
    )
    if not audits:
        period_msg = f"la fecha {s_date}" if s_date == e_date else f"el período {s_date} a {e_date}"
        area_msg = f" en el área '{area_name}'" if area_name else ""
        raise HTTPException(
            status_code=404,
            detail=f"No hay auditorías disponibles para {period_msg}{area_msg}.",
        )

    pdf_bytes = generate_daily_report_pdf(
        audits,
        report_date=s_date,
        end_date=e_date,
        area_name=area_name,
    )
    slug_area = f"_{area_name.lower().replace(' ', '_')}" if area_name else ""
    filename = (
        f"informe_auditorias{slug_area}_{s_date}.pdf"
        if s_date == e_date
        else f"informe_auditorias{slug_area}_{s_date}_al_{e_date}.pdf"
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{audit_id}", response_model=AuditResponse)
def get_one(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    if not can_access_audit(audit, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para ver esta auditoría.")
    return audit


@router.put("/{audit_id}", response_model=AuditResponse)
def update(
    audit_id: UUID,
    data: AuditUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    if not can_access_audit(audit, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para modificar esta auditoría.")
    return update_audit(db, audit, data)


@router.delete("/{audit_id}")
def delete(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    if not can_access_audit(audit, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para eliminar esta auditoría.")
    delete_audit(db, audit)
    return {"message": "Auditoría eliminada correctamente"}


@router.post("/{audit_id}/complete", response_model=AuditResponse)
def complete(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    if not can_access_audit(audit, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para completar esta auditoría.")
    if audit.status == "COMPLETADA":
        raise HTTPException(status_code=400, detail="La auditoría ya fue completada")
    return complete_audit(db, audit)


@router.get("/{audit_id}/report")
def individual_report(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    if not can_access_audit(audit, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para descargar el reporte de esta auditoría.")
    pdf_bytes = generate_audit_pdf(audit)
    filename = f"auditoria_{audit.code}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/upload-evidence")
def upload_evidence(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    stored_name, storage_path = save_file(file, "audits")
    base_url = str(request.base_url).rstrip("/")
    rel_url = f"/audits/evidence/{stored_name}"
    return {
        "url": f"{base_url}{rel_url}",
        "relative_url": rel_url,
        "original_name": file.filename,
        "stored_name": stored_name,
    }


@router.get("/evidence/{filename}")
def get_evidence_file(filename: str):
    file_path = BASE_STORAGE / "audits" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo de evidencia no encontrado.")
    content_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(
        path=file_path,
        media_type=content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "public, max-age=86400",
        },
    )
