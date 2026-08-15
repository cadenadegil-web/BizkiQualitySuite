from datetime import date, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit import Audit, AuditItem
from app.models.finding import Finding
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status
from app.schemas.audit import AuditCreate, AuditUpdate


# =====================================================
# Código consecutivo
# =====================================================

def generate_audit_code(db: Session) -> str:
    year = datetime.now().year
    total = db.query(Audit).count() + 1
    return f"AUD-{year}-{total:06}"


def generate_finding_code(db: Session) -> str:
    year = datetime.now().year
    total = db.query(Finding).count() + 1
    return f"HBPM-{year}-{total:06}"


# =====================================================
# CRUD Auditoría
# =====================================================

def create_audit(db: Session, data: AuditCreate) -> Audit:
    audit = Audit(
        code=generate_audit_code(db),
        audit_date=data.audit_date,
        shift=data.shift,
        auditor=data.auditor,
        observations=data.observations,
        area_id=data.area_id,
        status="PENDIENTE",
    )
    db.add(audit)
    db.flush()  # get audit.id

    for i, item_data in enumerate(data.items, start=1):
        item = AuditItem(
            audit_id=audit.id,
            order=item_data.order or i,
            norm=item_data.norm,
            control_point=item_data.control_point,
            result=item_data.result,
            comment=item_data.comment,
        )
        db.add(item)

    db.commit()
    db.refresh(audit)
    return audit


def get_audits(db: Session) -> list[Audit]:
    return (
        db.query(Audit)
        .filter(Audit.active.is_(True))
        .order_by(Audit.audit_date.desc())
        .all()
    )


def get_audit(db: Session, audit_id: UUID) -> Audit | None:
    return (
        db.query(Audit)
        .filter(Audit.id == audit_id, Audit.active.is_(True))
        .first()
    )


def get_audits_by_date(db: Session, target_date: date) -> list[Audit]:
    return (
        db.query(Audit)
        .filter(Audit.audit_date == target_date, Audit.active.is_(True))
        .order_by(Audit.created_at)
        .all()
    )


def update_audit(db: Session, audit: Audit, data: AuditUpdate) -> Audit:
    values = data.model_dump(exclude_unset=True, exclude={"items"})
    for key, value in values.items():
        setattr(audit, key, value)

    if data.items is not None:
        # Remove old items and replace
        for old_item in list(audit.items):
            db.delete(old_item)
        db.flush()
        for i, item_data in enumerate(data.items, start=1):
            item = AuditItem(
                audit_id=audit.id,
                order=item_data.order or i,
                norm=item_data.norm,
                control_point=item_data.control_point,
                result=item_data.result,
                comment=item_data.comment,
            )
            db.add(item)

    db.commit()
    db.refresh(audit)
    return audit


def delete_audit(db: Session, audit: Audit) -> Audit:
    audit.active = False
    db.commit()
    db.refresh(audit)
    return audit


# =====================================================
# Completar auditoría
# =====================================================

def complete_audit(db: Session, audit: Audit) -> Audit:
    """
    Calcula el puntaje de la auditoría y auto-genera Findings
    para cada ítem con resultado NO_CONFORME.
    """
    items = audit.items
    if not items:
        audit.status = "COMPLETADA"
        audit.score = 0.0
        db.commit()
        db.refresh(audit)
        return audit

    total = len(items)
    conformes = sum(1 for it in items if it.result == "CONFORME")
    audit.score = round((conformes / total) * 100, 1)
    audit.status = "COMPLETADA"

    # Obtener catálogos por defecto para los hallazgos auto-generados
    nc_classification = (
        db.query(Classification)
        .filter(Classification.name.ilike("%no conforme%"))
        .first()
        or db.query(Classification).first()
    )
    open_status = (
        db.query(Status)
        .filter(Status.name.ilike("%abierto%"))
        .first()
        or db.query(Status).first()
    )

    # Auto-generar hallazgos para no conformidades
    for item in items:
        if item.result == "NO_CONFORME":
            description = (
                f"[Auditoría {audit.code}] {item.norm}: {item.control_point}"
            )
            if item.comment:
                description += f". Comentario: {item.comment}"

            finding = Finding(
                code=generate_finding_code(db),
                process=f"Auditoría {audit.shift} — {audit.area.name if audit.area else ''}",
                finding_type="No Conformidad",
                description=description,
                responsible=audit.auditor,
                area_id=audit.area_id,
                classification_id=nc_classification.id if nc_classification else None,
                status_id=open_status.id if open_status else None,
                created_at=datetime.now(),
                active=True,
            )
            db.add(finding)
            db.flush()  # Ensure finding.id is generated before next iteration

    db.commit()
    db.refresh(audit)
    return audit
