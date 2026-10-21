from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.finding import FindingCreate, FindingResponse, FindingUpdate
from app.security.auth import get_current_user
from app.services.finding_service import (
    can_access_finding,
    create_finding,
    delete_finding,
    get_finding,
    get_findings,
    update_finding,
)

router = APIRouter(
    prefix="/findings",
    tags=["Hallazgos BPM"],
)


@router.post(
    "/",
    response_model=FindingResponse,
)
def create(
    finding: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_finding(db, finding, current_user=current_user)


@router.get(
    "/",
    response_model=list[FindingResponse],
)
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_findings(db, current_user=current_user)


@router.get(
    "/{finding_id}",
    response_model=FindingResponse,
)
def get_one(
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finding = get_finding(db, finding_id)

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado",
        )

    if not can_access_finding(finding, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver este hallazgo.",
        )

    return finding


@router.put(
    "/{finding_id}",
    response_model=FindingResponse,
)
def update(
    finding_id: UUID,
    data: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finding = get_finding(db, finding_id)

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado",
        )

    if not can_access_finding(finding, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar este hallazgo.",
        )

    return update_finding(
        db,
        finding,
        data,
    )


@router.delete(
    "/{finding_id}",
)
def delete(
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    finding = get_finding(db, finding_id)

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado",
        )

    if not can_access_finding(finding, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar este hallazgo.",
        )

    delete_finding(
        db,
        finding,
    )

    return {
        "message": "Hallazgo eliminado correctamente"
    }