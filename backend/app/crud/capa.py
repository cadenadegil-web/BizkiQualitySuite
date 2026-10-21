from uuid import UUID

from sqlalchemy.orm import Session

from app.models.capa import CAPA
from app.schemas.capa import CAPACreate
from app.schemas.capa import CAPAUpdate


# =====================================================
# CREATE
# =====================================================

def create_capa(
    db: Session,
    capa: CAPACreate,
    code: str,
) -> CAPA:

    db_capa = CAPA(
        code=code,
        finding_id=capa.finding_id,
        title=capa.title,
        description=capa.description,
        action_type=capa.action_type,
        priority=capa.priority,
        responsible=capa.responsible,
        target_date=capa.target_date,
        completion_date=capa.completion_date,
        effectiveness_review=capa.effectiveness_review,
        effectiveness_date=capa.effectiveness_date,
        status=capa.status,
        comments=capa.comments,
    )

    db.add(db_capa)
    db.commit()
    db.refresh(db_capa)

    return db_capa


# =====================================================
# GET BY ID
# =====================================================

def get_capa(
    db: Session,
    capa_id: UUID,
) -> CAPA | None:

    return (
        db.query(CAPA)
        .filter(
            CAPA.id == capa_id,
            CAPA.active.is_(True),
        )
        .first()
    )


# =====================================================
# ACCESS CHECK & GET ALL
# =====================================================

from sqlalchemy import func, or_
from app.models.finding import Finding
from app.models.user import User
from app.security.auth import is_supervisor_or_admin


def can_access_capa(capa: CAPA, user: User) -> bool:
    if is_supervisor_or_admin(user):
        return True
    name_clean = (user.full_name or "").strip().lower()
    user_clean = (user.username or "").strip().lower()
    resp_clean = (capa.responsible or "").strip().lower()
    if resp_clean in (name_clean, user_clean):
        return True
    if capa.finding:
        if capa.finding.user_id and str(capa.finding.user_id) == str(user.id):
            return True
        finding_resp = (capa.finding.responsible or "").strip().lower()
        if finding_resp in (name_clean, user_clean):
            return True
    return False


def get_all_capas(
    db: Session,
    current_user: User | None = None,
) -> list[CAPA]:
    query = db.query(CAPA).filter(CAPA.active.is_(True))

    if current_user and not is_supervisor_or_admin(current_user):
        name_clean = (current_user.full_name or "").strip().lower()
        user_clean = (current_user.username or "").strip().lower()
        filters = [
            CAPA.finding.has(Finding.user_id == current_user.id)
        ]
        if name_clean:
            filters.append(func.lower(CAPA.responsible) == name_clean)
            filters.append(CAPA.finding.has(func.lower(Finding.responsible) == name_clean))
        if user_clean:
            filters.append(func.lower(CAPA.responsible) == user_clean)
            filters.append(CAPA.finding.has(func.lower(Finding.responsible) == user_clean))
        query = query.filter(or_(*filters))

    return query.order_by(CAPA.created_at.desc()).all()


# =====================================================
# GET BY FINDING
# =====================================================

def get_capas_by_finding(
    db: Session,
    finding_id: UUID,
) -> list[CAPA]:

    return (
        db.query(CAPA)
        .filter(
            CAPA.finding_id == finding_id,
            CAPA.active.is_(True),
        )
        .order_by(CAPA.created_at.desc())
        .all()
    )


# =====================================================
# UPDATE
# =====================================================

def update_capa(
    db: Session,
    capa_id: UUID,
    data: CAPAUpdate,
) -> CAPA | None:

    db_capa = get_capa(
        db,
        capa_id,
    )

    if db_capa is None:
        return None

    values = data.model_dump(
        exclude_unset=True,
    )

    for key, value in values.items():
        setattr(
            db_capa,
            key,
            value,
        )

    db.commit()
    db.refresh(db_capa)

    return db_capa


# =====================================================
# DELETE (Soft Delete)
# =====================================================

def delete_capa(
    db: Session,
    capa_id: UUID,
) -> CAPA | None:

    db_capa = get_capa(
        db,
        capa_id,
    )

    if db_capa is None:
        return None

    db_capa.active = False

    db.commit()
    db.refresh(db_capa)

    return db_capa


# =====================================================
# RESTORE
# =====================================================

def restore_capa(
    db: Session,
    capa_id: UUID,
) -> CAPA | None:

    db_capa = (
        db.query(CAPA)
        .filter(
            CAPA.id == capa_id,
        )
        .first()
    )

    if db_capa is None:
        return None

    db_capa.active = True

    db.commit()
    db.refresh(db_capa)

    return db_capa