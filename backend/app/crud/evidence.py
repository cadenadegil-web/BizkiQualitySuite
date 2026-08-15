from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.schemas.evidence import EvidenceCreate
from app.schemas.evidence import EvidenceUpdate


# =====================================================
# CREATE
# =====================================================

def create_evidence(
    db: Session,
    evidence: EvidenceCreate,
    stored_name: str,
    storage_path: str,
    uploaded_by: UUID | None = None,
) -> Evidence:

    db_evidence = Evidence(
        finding_id=evidence.finding_id,
        capa_id=evidence.capa_id,
        uploaded_by=uploaded_by,
        original_name=evidence.original_name,
        stored_name=stored_name,
        storage_path=storage_path,
        mime_type=evidence.mime_type,
        extension=evidence.extension,
        file_size=evidence.file_size,
    )

    try:
        db.add(db_evidence)
        db.commit()
        db.refresh(db_evidence)
        return db_evidence

    except SQLAlchemyError:
        db.rollback()
        raise


# =====================================================
# GET BY ID
# =====================================================

def get_evidence(
    db: Session,
    evidence_id: UUID,
) -> Evidence | None:

    return (
        db.query(Evidence)
        .filter(
            Evidence.id == evidence_id,
            Evidence.active.is_(True),
        )
        .first()
    )


# =====================================================
# GET ALL
# =====================================================

def get_all_evidences(
    db: Session,
) -> list[Evidence]:

    return (
        db.query(Evidence)
        .filter(Evidence.active.is_(True))
        .order_by(Evidence.created_at.desc())
        .all()
    )


# =====================================================
# GET BY FINDING
# =====================================================

def get_evidences_by_finding(
    db: Session,
    finding_id: UUID,
) -> list[Evidence]:

    return (
        db.query(Evidence)
        .filter(
            Evidence.finding_id == finding_id,
            Evidence.active.is_(True),
        )
        .order_by(Evidence.created_at.desc())
        .all()
    )


# =====================================================
# GET BY CAPA
# =====================================================

def get_evidences_by_capa(
    db: Session,
    capa_id: UUID,
) -> list[Evidence]:

    return (
        db.query(Evidence)
        .filter(
            Evidence.capa_id == capa_id,
            Evidence.active.is_(True),
        )
        .order_by(Evidence.created_at.desc())
        .all()
    )


# =====================================================
# UPDATE
# =====================================================

def update_evidence(
    db: Session,
    evidence_id: UUID,
    evidence: EvidenceUpdate,
) -> Evidence | None:

    db_evidence = get_evidence(
        db,
        evidence_id,
    )

    if db_evidence is None:
        return None

    update_data = evidence.model_dump(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            db_evidence,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(db_evidence)
        return db_evidence

    except SQLAlchemyError:
        db.rollback()
        raise


# =====================================================
# DELETE (Soft Delete)
# =====================================================

def delete_evidence(
    db: Session,
    evidence_id: UUID,
) -> Evidence | None:

    db_evidence = get_evidence(
        db,
        evidence_id,
    )

    if db_evidence is None:
        return None

    db_evidence.active = False

    try:
        db.commit()
        db.refresh(db_evidence)
        return db_evidence

    except SQLAlchemyError:
        db.rollback()
        raise


# =====================================================
# RESTORE
# =====================================================

def restore_evidence(
    db: Session,
    evidence_id: UUID,
) -> Evidence | None:

    db_evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )

    if db_evidence is None:
        return None

    db_evidence.active = True

    try:
        db.commit()
        db.refresh(db_evidence)
        return db_evidence

    except SQLAlchemyError:
        db.rollback()
        raise