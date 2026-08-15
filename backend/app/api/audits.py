from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.audit import AuditCreate, AuditResponse, AuditUpdate
from app.services.audit_service import (
    complete_audit, create_audit, delete_audit,
    get_audit, get_audits, get_audits_by_date, update_audit,
)
from app.services.audit_report_service import (
    generate_audit_pdf, generate_daily_report_pdf,
)

router = APIRouter(prefix="/audits", tags=["Auditorías"])


@router.post("/", response_model=AuditResponse)
def create(data: AuditCreate, db: Session = Depends(get_db)):
    return create_audit(db, data)


@router.get("/", response_model=list[AuditResponse])
def list_all(db: Session = Depends(get_db)):
    return get_audits(db)


@router.get("/reports/daily")
def daily_report(
    report_date: date = Query(default=None, description="Fecha YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    target = report_date or date.today()
    audits = get_audits_by_date(db, target)
    if not audits:
        raise HTTPException(status_code=404, detail=f"No hay auditorías para la fecha {target}")
    pdf_bytes = generate_daily_report_pdf(audits, target)
    filename = f"informe_diario_{target}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{audit_id}", response_model=AuditResponse)
def get_one(audit_id: UUID, db: Session = Depends(get_db)):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    return audit


@router.put("/{audit_id}", response_model=AuditResponse)
def update(audit_id: UUID, data: AuditUpdate, db: Session = Depends(get_db)):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    return update_audit(db, audit, data)


@router.delete("/{audit_id}")
def delete(audit_id: UUID, db: Session = Depends(get_db)):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    delete_audit(db, audit)
    return {"message": "Auditoría eliminada correctamente"}


@router.post("/{audit_id}/complete", response_model=AuditResponse)
def complete(audit_id: UUID, db: Session = Depends(get_db)):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    if audit.status == "COMPLETADA":
        raise HTTPException(status_code=400, detail="La auditoría ya fue completada")
    return complete_audit(db, audit)


@router.get("/{audit_id}/report")
def individual_report(audit_id: UUID, db: Session = Depends(get_db)):
    audit = get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Auditoría no encontrada")
    pdf_bytes = generate_audit_pdf(audit)
    filename = f"auditoria_{audit.code}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
