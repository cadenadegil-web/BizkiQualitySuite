from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.audit import AuditCreate, AuditResponse, AuditUpdate
from app.security.auth import get_current_user
from app.services.audit_service import (
    can_access_audit, complete_audit, create_audit, delete_audit,
    get_audit, get_audits, get_audits_by_date, update_audit,
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
    report_date: date = Query(default=None, description="Fecha YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = report_date or date.today()
    audits = get_audits_by_date(db, target, current_user=current_user)
    if not audits:
        raise HTTPException(status_code=404, detail=f"No hay auditorías disponibles para la fecha {target}")
    pdf_bytes = generate_daily_report_pdf(audits, target)
    filename = f"informe_diario_{target}.pdf"
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
