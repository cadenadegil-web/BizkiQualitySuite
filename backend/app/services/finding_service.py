from datetime import datetime

from sqlalchemy.orm import Session

from app.models.finding import Finding
from app.schemas.finding import FindingCreate
from app.schemas.finding import FindingUpdate


def generate_code():

    year = datetime.now().year

    sequence = 1

    code = f"HBPM-{year}-{sequence:06}"

    return code


def create_finding(
    db: Session,
    finding: FindingCreate,
):

    new_finding = Finding(
        code=generate_code(),
        area=finding.area,
        process=finding.process,
        finding_type=finding.finding_type,
        classification=finding.classification,
        description=finding.description,
        responsible=finding.responsible,
    )

    db.add(new_finding)
    db.commit()
    db.refresh(new_finding)

    return new_finding


def get_findings(db: Session):

    return db.query(Finding).all()


def get_finding(
    db: Session,
    finding_id,
):

    return (
        db.query(Finding)
        .filter(Finding.id == finding_id)
        .first()
    )


def update_finding(
    db: Session,
    finding,
    data: FindingUpdate,
):

    values = data.model_dump(exclude_unset=True)

    for key, value in values.items():
        setattr(finding, key, value)

    db.commit()
    db.refresh(finding)

    return finding


def delete_finding(
    db: Session,
    finding,
):

    finding.active = False

    db.commit()

    return finding