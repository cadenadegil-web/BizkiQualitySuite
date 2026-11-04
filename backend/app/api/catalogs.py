from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status
from app.models.norm import Norm
from app.models.responsible import Responsible
from app.models.auditor import Auditor


class CatalogItemSchema(BaseModel):
    id: UUID
    name: str
    plant: str | None = None
    active: bool

    class Config:
        from_attributes = True


class CatalogItemCreateSchema(BaseModel):
    name: str
    plant: str | None = None
    active: bool = True


class CatalogItemUpdateSchema(BaseModel):
    name: str | None = None
    plant: str | None = None
    active: bool | None = None


class AreaItemSchema(BaseModel):
    id: UUID
    name: str
    plant: str | None = None
    active: bool

    class Config:
        from_attributes = True


class AreaItemCreateSchema(BaseModel):
    name: str
    plant: str | None = None
    active: bool = True


class AreaItemUpdateSchema(BaseModel):
    name: str | None = None
    plant: str | None = None
    active: bool | None = None


class NormItemSchema(BaseModel):
    id: UUID
    name: str
    description: str
    category: str | None = None
    active: bool

    class Config:
        from_attributes = True


class NormItemCreateSchema(BaseModel):
    name: str
    description: str
    category: str | None = None
    active: bool = True


class NormItemUpdateSchema(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    active: bool | None = None


router = APIRouter(
    prefix="/catalogs",
    tags=["Catálogos"],
)

# =========================================================
# ÁREAS
# =========================================================

@router.get("/areas", response_model=list[AreaItemSchema])
def get_areas(db: Session = Depends(get_db)):
    return db.query(Area).order_by(Area.plant, Area.name).all()


@router.post("/areas", response_model=AreaItemSchema)
def create_area(item: AreaItemCreateSchema, db: Session = Depends(get_db)):
    query = db.query(Area).filter(Area.name == item.name)
    if item.plant:
        query = query.filter(Area.plant == item.plant)
    else:
        query = query.filter(Area.plant.is_(None))
    if query.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El área ya existe para esta planta.")
    new_area = Area(name=item.name, plant=item.plant, active=item.active)
    db.add(new_area)
    db.commit()
    db.refresh(new_area)
    return new_area


@router.put("/areas/{area_id}", response_model=AreaItemSchema)
def update_area(area_id: UUID, item: AreaItemUpdateSchema, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Área no encontrada.")
    target_name = item.name if item.name is not None else area.name
    target_plant = item.plant if item.plant is not None else area.plant

    if target_name != area.name or target_plant != area.plant:
        dup_query = db.query(Area).filter(Area.name == target_name, Area.id != area_id)
        if target_plant:
            dup_query = dup_query.filter(Area.plant == target_plant)
        else:
            dup_query = dup_query.filter(Area.plant.is_(None))
        if dup_query.first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un área con ese nombre para esta planta.")

    if item.name is not None:
        area.name = item.name
    if item.plant is not None:
        area.plant = item.plant
    if item.active is not None:
        area.active = item.active
    db.commit()
    db.refresh(area)
    return area


@router.delete("/areas/{area_id}")
def delete_area(area_id: UUID, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Área no encontrada.")
    db.delete(area)
    db.commit()
    return {"message": "Área eliminada exitosamente"}


# =========================================================
# CLASIFICACIONES
# =========================================================

@router.get("/classifications", response_model=list[CatalogItemSchema])
def get_classifications(db: Session = Depends(get_db)):
    return db.query(Classification).order_by(Classification.name).all()


@router.post("/classifications", response_model=CatalogItemSchema)
def create_classification(item: CatalogItemCreateSchema, db: Session = Depends(get_db)):
    if db.query(Classification).filter(Classification.name == item.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La clasificación ya existe.")
    new_item = Classification(name=item.name, active=item.active)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/classifications/{classification_id}", response_model=CatalogItemSchema)
def update_classification(classification_id: UUID, item: CatalogItemUpdateSchema, db: Session = Depends(get_db)):
    classification = db.query(Classification).filter(Classification.id == classification_id).first()
    if not classification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clasificación no encontrada.")
    if item.name and item.name != classification.name:
        if db.query(Classification).filter(Classification.name == item.name).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una clasificación con ese nombre.")
        classification.name = item.name
    if item.active is not None:
        classification.active = item.active
    db.commit()
    db.refresh(classification)
    return classification


@router.delete("/classifications/{classification_id}")
def delete_classification(classification_id: UUID, db: Session = Depends(get_db)):
    classification = db.query(Classification).filter(Classification.id == classification_id).first()
    if not classification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clasificación no encontrada.")
    db.delete(classification)
    db.commit()
    return {"message": "Clasificación eliminada exitosamente"}


# =========================================================
# ESTADOS
# =========================================================

@router.get("/statuses", response_model=list[CatalogItemSchema])
def get_statuses(db: Session = Depends(get_db)):
    return db.query(Status).order_by(Status.name).all()


@router.post("/statuses", response_model=CatalogItemSchema)
def create_status(item: CatalogItemCreateSchema, db: Session = Depends(get_db)):
    if db.query(Status).filter(Status.name == item.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El estado ya existe.")
    new_item = Status(name=item.name, active=item.active)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/statuses/{status_id}", response_model=CatalogItemSchema)
def update_status(status_id: UUID, item: CatalogItemUpdateSchema, db: Session = Depends(get_db)):
    status_obj = db.query(Status).filter(Status.id == status_id).first()
    if not status_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estado no encontrado.")
    if item.name and item.name != status_obj.name:
        if db.query(Status).filter(Status.name == item.name).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un estado con ese nombre.")
        status_obj.name = item.name
    if item.active is not None:
        status_obj.active = item.active
    db.commit()
    db.refresh(status_obj)
    return status_obj


@router.delete("/statuses/{status_id}")
def delete_status(status_id: UUID, db: Session = Depends(get_db)):
    status_obj = db.query(Status).filter(Status.id == status_id).first()
    if not status_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estado no encontrado.")
    db.delete(status_obj)
    db.commit()
    return {"message": "Estado eliminado exitosamente"}


# =========================================================
# NORMAS
# =========================================================

@router.get("/norms", response_model=list[NormItemSchema])
def get_norms(db: Session = Depends(get_db)):
    return db.query(Norm).order_by(Norm.name).all()


@router.post("/norms", response_model=NormItemSchema)
def create_norm(item: NormItemCreateSchema, db: Session = Depends(get_db)):
    if db.query(Norm).filter(Norm.name == item.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La norma ya existe.")
    new_norm = Norm(name=item.name, description=item.description, category=item.category, active=item.active)
    db.add(new_norm)
    db.commit()
    db.refresh(new_norm)
    return new_norm


@router.put("/norms/{norm_id}", response_model=NormItemSchema)
def update_norm(norm_id: UUID, item: NormItemUpdateSchema, db: Session = Depends(get_db)):
    norm_obj = db.query(Norm).filter(Norm.id == norm_id).first()
    if not norm_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Norma no encontrada.")
    if item.name and item.name != norm_obj.name:
        if db.query(Norm).filter(Norm.name == item.name).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una norma con ese nombre.")
        norm_obj.name = item.name
    if item.description is not None:
        norm_obj.description = item.description
    if item.category is not None:
        norm_obj.category = item.category
    if item.active is not None:
        norm_obj.active = item.active
    db.commit()
    db.refresh(norm_obj)
    return norm_obj


@router.delete("/norms/{norm_id}")
def delete_norm(norm_id: UUID, db: Session = Depends(get_db)):
    norm_obj = db.query(Norm).filter(Norm.id == norm_id).first()
    if not norm_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Norma no encontrada.")
    db.delete(norm_obj)
    db.commit()
    return {"message": "Norma eliminada exitosamente"}


# =========================================================
# RESPONSABLES
# =========================================================

@router.get("/responsibles", response_model=list[CatalogItemSchema])
def get_responsibles(db: Session = Depends(get_db)):
    return db.query(Responsible).order_by(Responsible.plant.asc().nullsfirst(), Responsible.name.asc()).all()


@router.post("/responsibles", response_model=CatalogItemSchema)
def create_responsible(item: CatalogItemCreateSchema, db: Session = Depends(get_db)):
    query = db.query(Responsible).filter(Responsible.name == item.name)
    if item.plant:
        query = query.filter(Responsible.plant == item.plant)
    else:
        query = query.filter(Responsible.plant.is_(None))
    if query.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El responsable ya existe.")
    new_resp = Responsible(name=item.name, plant=item.plant, active=item.active)
    db.add(new_resp)
    db.commit()
    db.refresh(new_resp)
    return new_resp


@router.put("/responsibles/{resp_id}", response_model=CatalogItemSchema)
def update_responsible(resp_id: UUID, item: CatalogItemUpdateSchema, db: Session = Depends(get_db)):
    resp = db.query(Responsible).filter(Responsible.id == resp_id).first()
    if not resp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsable no encontrado.")
    target_name = item.name if item.name is not None else resp.name
    target_plant = item.plant if item.plant is not None else resp.plant

    if target_name != resp.name or target_plant != resp.plant:
        dup_query = db.query(Responsible).filter(Responsible.name == target_name, Responsible.id != resp_id)
        if target_plant:
            dup_query = dup_query.filter(Responsible.plant == target_plant)
        else:
            dup_query = dup_query.filter(Responsible.plant.is_(None))
        if dup_query.first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un responsable con ese nombre.")

    if item.name is not None:
        resp.name = item.name
    if item.plant is not None:
        resp.plant = item.plant
    if item.active is not None:
        resp.active = item.active
    db.commit()
    db.refresh(resp)
    return resp


@router.delete("/responsibles/{resp_id}")
def delete_responsible(resp_id: UUID, db: Session = Depends(get_db)):
    resp = db.query(Responsible).filter(Responsible.id == resp_id).first()
    if not resp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsable no encontrado.")
    db.delete(resp)
    db.commit()
    return {"message": "Responsable eliminado exitosamente"}


# =========================================================
# AUDITORES
# =========================================================

@router.get("/auditors", response_model=list[CatalogItemSchema])
def get_auditors(db: Session = Depends(get_db)):
    return db.query(Auditor).order_by(Auditor.plant.asc().nullsfirst(), Auditor.name.asc()).all()


@router.post("/auditors", response_model=CatalogItemSchema)
def create_auditor(item: CatalogItemCreateSchema, db: Session = Depends(get_db)):
    query = db.query(Auditor).filter(Auditor.name == item.name)
    if item.plant:
        query = query.filter(Auditor.plant == item.plant)
    else:
        query = query.filter(Auditor.plant.is_(None))
    if query.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El auditor ya existe.")
    new_auditor = Auditor(name=item.name, plant=item.plant, active=item.active)
    db.add(new_auditor)
    db.commit()
    db.refresh(new_auditor)
    return new_auditor


@router.put("/auditors/{auditor_id}", response_model=CatalogItemSchema)
def update_auditor(auditor_id: UUID, item: CatalogItemUpdateSchema, db: Session = Depends(get_db)):
    auditor = db.query(Auditor).filter(Auditor.id == auditor_id).first()
    if not auditor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditor no encontrado.")
    target_name = item.name if item.name is not None else auditor.name
    target_plant = item.plant if item.plant is not None else auditor.plant

    if target_name != auditor.name or target_plant != auditor.plant:
        dup_query = db.query(Auditor).filter(Auditor.name == target_name, Auditor.id != auditor_id)
        if target_plant:
            dup_query = dup_query.filter(Auditor.plant == target_plant)
        else:
            dup_query = dup_query.filter(Auditor.plant.is_(None))
        if dup_query.first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un auditor con ese nombre.")

    if item.name is not None:
        auditor.name = item.name
    if item.plant is not None:
        auditor.plant = item.plant
    if item.active is not None:
        auditor.active = item.active
    db.commit()
    db.refresh(auditor)
    return auditor


@router.delete("/auditors/{auditor_id}")
def delete_auditor(auditor_id: UUID, db: Session = Depends(get_db)):
    auditor = db.query(Auditor).filter(Auditor.id == auditor_id).first()
    if not auditor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditor no encontrado.")
    db.delete(auditor)
    db.commit()
    return {"message": "Auditor eliminado exitosamente"}
