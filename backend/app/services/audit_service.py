from datetime import date, datetime
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.audit import Audit, AuditItem
from app.models.finding import Finding
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status
from app.models.user import User
from app.schemas.audit import AuditCreate, AuditUpdate
from app.security.auth import is_supervisor_or_admin


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
# Clasificación de Objetivos de Medición
# =====================================================

def classify_item_objective(norm: str, control_point: str) -> str:
    text = f"{norm} {control_point}".lower()
    if any(w in text for w in ["plaga", "roedor", "insecto", "cebadero", "desratiz", "fumiga", "infestaci"]):
        return "Control de Plagas"
    if any(w in text for w in ["químic", "quimic", "sustancia", "detergente", "desinfectante", "msds", "fds", "reactivo"]):
        return "Control de Químicos"
    if any(w in text for w in ["personal", "uniforme", "epp", "manos", "joya", "uña", "salud", "enfermedad", "manipulador", "higiene personal"]):
        return "Personal"
    if any(w in text for w in ["alergen", "alérgen"]):
        return "Control de Alérgenos"
    if any(w in text for w in ["calibra", "equipo", "utensilio", "mantenimiento", "balanza", "termómetro", "termometro"]):
        return "Equipos y Utensilios"
    if any(w in text for w in ["térmic", "termic", "temperatura", "humedad", "cocción", "coccion", "enfriamiento", "horno"]):
        return "Control de Procesos"
    if any(w in text for w in ["trazabil", "lote", "etiqueta", "caducidad", "vencimiento"]):
        return "Trazabilidad y Etiquetado"
    if any(w in text for w in ["almacén", "almacen", "peps", "inventario", "estiba", "tarima", "bodega"]):
        return "Almacenamiento"
    if any(w in text for w in ["limpi", "instalaci", "polvo", "telaraña", "telarana", "drenaje", "saneamiento", "poes"]):
        return "Limpieza e Instalaciones"
    if any(w in text for w in ["desecho", "merma", "reproceso", "desperdicio", "food loss"]):
        return "Manejo de Desechos"
    if any(w in text for w in ["pcc", "haccp", "punto crítico", "punto critico", "peligro"]):
        return "Puntos Críticos (HACCP)"
    if any(w in text for w in ["extintor", "evacuaci", "primeros auxilios", "botiquín", "botiquin", "sst"]):
        return "Seguridad y Salud (SST)"
    if any(w in text for w in ["muestra", "laboratorio", "calidad", "especificación", "especificacion"]):
        return "Control de Calidad"
    if any(w in text for w in ["defense", "fraud", "defensa", "fraude", "sabotaje"]):
        return "Defensa y Fraude Alimentario"
    return "Control General"


def populate_audit_objectives(audit: Audit) -> Audit:
    """
    Asegura que cada ítem tenga su objetivo clasificado y que la auditoría
    tenga su lista de objetivos y campo measurement_objective poblado.
    """
    objs = []
    if audit.items:
        for it in audit.items:
            if not it.objective:
                it.objective = classify_item_objective(it.norm, it.control_point)
            if it.objective and it.objective not in objs:
                objs.append(it.objective)
    
    if not audit.measurement_objective and objs:
        audit.measurement_objective = ", ".join(objs)
    elif audit.measurement_objective:
        stored_objs = [o.strip() for o in audit.measurement_objective.split(",") if o.strip()]
        for so in stored_objs:
            if so not in objs:
                objs.append(so)
                
    audit.objectives = objs
    return audit


# =====================================================
# CRUD Auditoría
# =====================================================

def can_access_audit(audit: Audit, user: User) -> bool:
    """
    Verifica si un usuario tiene permiso para acceder o modificar una auditoría.
    Los supervisores y administradores tienen acceso global.
    Los demás usuarios solo pueden acceder a sus propias auditorías.
    """
    if is_supervisor_or_admin(user):
        return True
    if audit.user_id and str(audit.user_id) == str(user.id):
        return True
    name_clean = (user.full_name or "").strip().lower()
    user_clean = (user.username or "").strip().lower()
    auditor_clean = (audit.auditor or "").strip().lower()
    return auditor_clean in (name_clean, user_clean)


def create_audit(db: Session, data: AuditCreate, current_user: User | None = None) -> Audit:
    auditor_name = data.auditor.strip() if data.auditor and data.auditor.strip() else (
        current_user.full_name if (current_user and current_user.full_name) else (current_user.username if current_user else "Auditor")
    )
    user_id = current_user.id if current_user else data.user_id

    audit = Audit(
        code=generate_audit_code(db),
        audit_date=data.audit_date,
        shift=data.shift,
        auditor=auditor_name,
        user_id=user_id,
        measurement_objective=data.measurement_objective,
        observations=data.observations,
        area_id=data.area_id,
        status="PENDIENTE",
    )
    db.add(audit)
    db.flush()  # get audit.id

    distinct_objs = []
    for i, item_data in enumerate(data.items, start=1):
        obj = item_data.objective or classify_item_objective(item_data.norm, item_data.control_point)
        if obj and obj not in distinct_objs:
            distinct_objs.append(obj)
        item = AuditItem(
            audit_id=audit.id,
            order=item_data.order or i,
            norm=item_data.norm,
            control_point=item_data.control_point,
            objective=obj,
            result=item_data.result,
            comment=item_data.comment,
        )
        db.add(item)

    if not audit.measurement_objective and distinct_objs:
        audit.measurement_objective = ", ".join(distinct_objs)

    db.commit()
    db.refresh(audit)
    populate_audit_objectives(audit)
    return audit


def get_audits(db: Session, current_user: User | None = None) -> list[Audit]:
    query = db.query(Audit).filter(Audit.active.is_(True))

    if current_user and not is_supervisor_or_admin(current_user):
        name_clean = (current_user.full_name or "").strip().lower()
        user_clean = (current_user.username or "").strip().lower()
        user_filters = [Audit.user_id == current_user.id]
        if name_clean:
            user_filters.append(func.lower(Audit.auditor) == name_clean)
        if user_clean:
            user_filters.append(func.lower(Audit.auditor) == user_clean)
        query = query.filter(or_(*user_filters))

    audits = query.order_by(Audit.audit_date.desc()).all()
    for a in audits:
        populate_audit_objectives(a)
    return audits


def get_audit(db: Session, audit_id: UUID) -> Audit | None:
    audit = (
        db.query(Audit)
        .filter(Audit.id == audit_id, Audit.active.is_(True))
        .first()
    )
    if audit:
        populate_audit_objectives(audit)
    return audit


def get_audits_by_date(db: Session, target_date: date, current_user: User | None = None) -> list[Audit]:
    return get_audits_for_report(db, start_date=target_date, end_date=target_date, current_user=current_user)


def get_audits_for_report(
    db: Session,
    start_date: date,
    end_date: date,
    area_id: UUID | None = None,
    current_user: User | None = None,
) -> list[Audit]:
    query = (
        db.query(Audit)
        .outerjoin(Area, Audit.area_id == Area.id)
        .filter(
            Audit.audit_date >= start_date,
            Audit.audit_date <= end_date,
            Audit.active.is_(True),
        )
    )

    if area_id:
        query = query.filter(Audit.area_id == area_id)

    if current_user and not is_supervisor_or_admin(current_user):
        name_clean = (current_user.full_name or "").strip().lower()
        user_clean = (current_user.username or "").strip().lower()
        user_filters = [Audit.user_id == current_user.id]
        if name_clean:
            user_filters.append(func.lower(Audit.auditor) == name_clean)
        if user_clean:
            user_filters.append(func.lower(Audit.auditor) == user_clean)
        query = query.filter(or_(*user_filters))

    audits = query.order_by(Area.name.asc(), Audit.audit_date.asc(), Audit.created_at.asc()).all()
    for a in audits:
        populate_audit_objectives(a)
    return audits


def sync_audit_findings(db: Session, audit: Audit) -> None:
    """
    Sincroniza las No Conformidades (Findings) asociadas a los ítems de la auditoría.
    Crea o actualiza hallazgos para ítems NO_CONFORME, y desactiva hallazgos
    si el ítem cambia a CONFORME u OBSERVACION.
    """
    items = audit.items
    if not items:
        return

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

    for item in items:
        # Buscar hallazgo existente vinculado por audit_item_id o por audit_id y coincidencia de descripción
        existing_finding = (
            db.query(Finding)
            .filter(Finding.audit_item_id == item.id)
            .first()
        )
        if not existing_finding:
            prefix = f"[Auditoría {audit.code}] {item.norm}: {item.control_point}"
            existing_finding = (
                db.query(Finding)
                .filter(
                    Finding.audit_id == audit.id,
                    Finding.description.startswith(prefix)
                )
                .first()
            )

        description = f"[Auditoría {audit.code}] {item.norm}: {item.control_point}"
        if item.comment:
            description += f". Comentario: {item.comment}"

        process_name = f"Auditoría {audit.shift} — {audit.area.name if audit.area else ''}"

        if item.result == "NO_CONFORME":
            if existing_finding:
                existing_finding.description = description
                existing_finding.process = process_name
                existing_finding.responsible = audit.auditor
                existing_finding.area_id = audit.area_id
                existing_finding.audit_id = audit.id
                existing_finding.audit_item_id = item.id
                existing_finding.active = True
            else:
                new_finding = Finding(
                    code=generate_finding_code(db),
                    process=process_name,
                    finding_type="No Conformidad",
                    description=description,
                    responsible=audit.auditor,
                    area_id=audit.area_id,
                    classification_id=nc_classification.id if nc_classification else None,
                    status_id=open_status.id if open_status else None,
                    audit_id=audit.id,
                    audit_item_id=item.id,
                    user_id=audit.user_id,
                    created_at=datetime.now(),
                    active=True,
                )
                db.add(new_finding)
                db.flush()
        else:
            # Si el ítem ya no es NO_CONFORME, desactivar el hallazgo existente si lo había
            if existing_finding:
                existing_finding.active = False


def update_audit(db: Session, audit: Audit, data: AuditUpdate) -> Audit:
    values = data.model_dump(exclude_unset=True, exclude={"items"})
    for key, value in values.items():
        setattr(audit, key, value)

    if data.items is not None:
        # Remove old items and replace
        for old_item in list(audit.items):
            db.delete(old_item)
        db.flush()
        distinct_objs = []
        for i, item_data in enumerate(data.items, start=1):
            obj = item_data.objective or classify_item_objective(item_data.norm, item_data.control_point)
            if obj and obj not in distinct_objs:
                distinct_objs.append(obj)
            item = AuditItem(
                audit_id=audit.id,
                order=item_data.order or i,
                norm=item_data.norm,
                control_point=item_data.control_point,
                objective=obj,
                result=item_data.result,
                comment=item_data.comment,
            )
            db.add(item)
        db.flush()

        if not audit.measurement_objective and distinct_objs:
            audit.measurement_objective = ", ".join(distinct_objs)

        if audit.status == "COMPLETADA":
            total = len(audit.items)
            conformes = sum(1 for it in audit.items if it.result == "CONFORME")
            audit.score = round((conformes / total) * 100, 1) if total > 0 else 0.0
            sync_audit_findings(db, audit)

    db.commit()
    db.refresh(audit)
    populate_audit_objectives(audit)
    return audit


def delete_audit(db: Session, audit: Audit) -> Audit:
    audit.active = False
    # Desactivar también los hallazgos vinculados
    db.query(Finding).filter(Finding.audit_id == audit.id).update({"active": False})
    db.commit()
    db.refresh(audit)
    return audit


# =====================================================
# Completar auditoría
# =====================================================

def complete_audit(db: Session, audit: Audit) -> Audit:
    """
    Calcula el puntaje de la auditoría y auto-genera/sincroniza Findings
    para cada ítem con resultado NO_CONFORME.
    """
    items = audit.items
    if not items:
        audit.status = "COMPLETADA"
        audit.score = 0.0
        db.commit()
        db.refresh(audit)
        populate_audit_objectives(audit)
        return audit

    total = len(items)
    conformes = sum(1 for it in items if it.result == "CONFORME")
    audit.score = round((conformes / total) * 100, 1)
    audit.status = "COMPLETADA"

    sync_audit_findings(db, audit)

    db.commit()
    db.refresh(audit)
    populate_audit_objectives(audit)
    return audit
