from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status
from app.models.norm import Norm


class CatalogItemSchema(BaseModel):
    id: UUID
    name: str
    active: bool

    class Config:
        from_attributes = True


class CatalogItemCreateSchema(BaseModel):
    name: str
    active: bool = True


class CatalogItemUpdateSchema(BaseModel):
    name: str | None = None
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

@router.get("/areas", response_model=list[CatalogItemSchema])
def get_areas(db: Session = Depends(get_db)):
    return db.query(Area).order_by(Area.name).all()


@router.post("/areas", response_model=CatalogItemSchema)
def create_area(item: CatalogItemCreateSchema, db: Session = Depends(get_db)):
    if db.query(Area).filter(Area.name == item.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El área ya existe.")
    new_area = Area(name=item.name, active=item.active)
    db.add(new_area)
    db.commit()
    db.refresh(new_area)
    return new_area


@router.put("/areas/{area_id}", response_model=CatalogItemSchema)
def update_area(area_id: UUID, item: CatalogItemUpdateSchema, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Área no encontrada.")
    if item.name and item.name != area.name:
        if db.query(Area).filter(Area.name == item.name).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un área con ese nombre.")
        area.name = item.name
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
