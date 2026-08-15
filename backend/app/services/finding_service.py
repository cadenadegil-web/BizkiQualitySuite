from datetime import datetime

from sqlalchemy.orm import Session

from app.models.finding import Finding
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status
from app.schemas.finding import FindingCreate
from app.schemas.finding import FindingUpdate


# =====================================================
# Generar código consecutivo
# =====================================================

def generate_code(db: Session) -> str:
    """
    Genera un código tipo:

    HBPM-2026-000001
    """

    year = datetime.now().year

    total = db.query(Finding).count() + 1

    return f"HBPM-{year}-{total:06}"


# =====================================================
# Crear Hallazgo
# =====================================================

def create_finding(
    db: Session,
    finding: FindingCreate,
):
    area_id = finding.area_id
    if not area_id:
        first_area = db.query(Area).first()
        if first_area:
            area_id = first_area.id

    classification_id = finding.classification_id
    if not classification_id:
        first_class = db.query(Classification).first()
        if first_class:
            classification_id = first_class.id

    status_id = finding.status_id
    if not status_id:
        first_status = db.query(Status).first()
        if first_status:
            status_id = first_status.id

    new_finding = Finding(
        code=generate_code(db),

        area_id=area_id,
        classification_id=classification_id,
        status_id=status_id,
        user_id=finding.user_id,

        process=finding.process,
        finding_type=finding.finding_type,
        description=finding.description,
        responsible=finding.responsible,
        created_at=finding.created_at if finding.created_at else datetime.now(),

        active=True,
    )

    db.add(new_finding)
    db.commit()
    db.refresh(new_finding)

    return new_finding


# =====================================================
# Listar Hallazgos
# =====================================================

def get_findings(
    db: Session,
):

    return (
        db.query(Finding)
        .filter(Finding.active.is_(True))
        .all()
    )


# =====================================================
# Obtener uno
# =====================================================

def get_finding(
    db: Session,
    finding_id,
):

    return (
        db.query(Finding)
        .filter(
            Finding.id == finding_id,
            Finding.active.is_(True),
        )
        .first()
    )


# =====================================================
# Actualizar
# =====================================================

def update_finding(
    db: Session,
    finding: Finding,
    data: FindingUpdate,
):

    values = data.model_dump(
        exclude_unset=True
    )

    for key, value in values.items():
        setattr(
            finding,
            key,
            value,
        )

    db.commit()
    db.refresh(finding)

    return finding


# =====================================================
# Eliminar (Soft Delete)
# =====================================================

def delete_finding(
    db: Session,
    finding: Finding,
):

    finding.active = False

    db.commit()
    db.refresh(finding)

    return finding