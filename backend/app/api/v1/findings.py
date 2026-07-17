from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.finding import FindingCreate
from app.schemas.finding import FindingResponse
from app.schemas.finding import FindingUpdate
from app.services.finding_service import create_finding
from app.services.finding_service import delete_finding
from app.services.finding_service import get_finding
from app.services.finding_service import get_findings
from app.services.finding_service import update_finding

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
):

    return create_finding(db, finding)


@router.get(
    "/",
    response_model=list[FindingResponse],
)
def list_all(
    db: Session = Depends(get_db),
):

    return get_findings(db)


@router.get(
    "/{finding_id}",
    response_model=FindingResponse,
)
def get_one(
    finding_id: UUID,
    db: Session = Depends(get_db),
):

    finding = get_finding(db, finding_id)

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado",
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
):

    finding = get_finding(db, finding_id)

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado",
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
):

    finding = get_finding(db, finding_id)

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Hallazgo no encontrado",
        )

    delete_finding(
        db,
        finding,
    )

    return {
        "message": "Hallazgo eliminado correctamente"
    }