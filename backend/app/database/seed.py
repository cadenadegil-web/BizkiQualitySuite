from sqlalchemy.orm import Session

from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status


def seed_database(db: Session):

    # -----------------------
    # ÁREAS
    # -----------------------

    if db.query(Area).count() == 0:

        areas = [

            Area(name="Pre-pesado"),
            Area(name="Mezcla"),
            Area(name="Depositadora"),
            Area(name="Horno"),
            Area(name="Enfriamiento"),
            Area(name="Empaque"),
            Area(name="Almacén"),
            Area(name="Despacho"),

        ]

        db.add_all(areas)

    # -----------------------
    # CLASIFICACIONES
    # -----------------------

    if db.query(Classification).count() == 0:

        classifications = [

            Classification(name="Crítico"),
            Classification(name="Mayor"),
            Classification(name="Menor"),
            Classification(name="Observación"),

        ]

        db.add_all(classifications)

    # -----------------------
    # ESTADOS
    # -----------------------

    if db.query(Status).count() == 0:

        statuses = [

            Status(name="Abierto"),
            Status(name="En proceso"),
            Status(name="Pendiente de validación"),
            Status(name="Cerrado"),

        ]

        db.add_all(statuses)

    db.commit()