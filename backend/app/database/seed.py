from sqlalchemy.orm import Session

from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status
from app.models.norm import Norm


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

    # -----------------------
    # NORMAS FSSC 22000
    # -----------------------

    if db.query(Norm).count() == 0:

        norms = [

            Norm(
                name="FSSC 22000 - 2.5.1: Gestión de Servicios y Materiales Adquiridos",
                category="FSSC Requisitos Adicionales (V7)",
                description="Control y verificación de materiales de empaque sostenibles, especificaciones de materias primas y aprobación de proveedores.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.2: Etiquetado de Producto (Alérgenos)",
                category="FSSC Requisitos Adicionales (V7)",
                description="Requisitos específicos de etiquetado para alérgenos y cumplimiento con regulaciones de inocuidad en el país de destino.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.3: Food Defense (Defensa Alimentaria)",
                category="FSSC Requisitos Adicionales (V7)",
                description="Evaluación de amenazas de sabotaje o contaminación intencionada y plan de mitigación documentado.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.4: Food Fraud (Mitigación del Fraude Alimentario)",
                category="FSSC Requisitos Adicionales (V7)",
                description="Plan de mitigación de vulnerabilidad frente al fraude alimentario basado en análisis de vulnerabilidad.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.5: Uso de Logotipos",
                category="FSSC Requisitos Adicionales (V7)",
                description="Control sobre el uso de logotipos de certificación e indicaciones de cumplimiento en empaques o papelería.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.6: Gestión de Alérgenos",
                category="FSSC Requisitos Adicionales (V7)",
                description="Plan formal de control de alérgenos que cubra almacenamiento, contaminación cruzada y validación de limpieza.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.7: Monitoreo Ambiental",
                category="FSSC Requisitos Adicionales (V7)",
                description="Programa de monitoreo ambiental microbiológico basado en riesgos en áreas de producción y empaque.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.8: Cultura de Inocuidad y Calidad",
                category="FSSC Requisitos Adicionales (V7)",
                description="Objetivos y actividades para el fomento de la cultura de inocuidad y calidad en el personal de todos los niveles.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.9: Control de Calidad",
                category="FSSC Requisitos Adicionales (V7)",
                description="Verificación del correcto funcionamiento de equipos, balanzas y calibración de instrumentos críticos.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.15: Food Loss and Waste (Pérdida y Desperdicio de Alimentos)",
                category="FSSC Requisitos Adicionales (V7)",
                description="Estrategias, medición y objetivos para reducir la pérdida y desperdicio de alimentos de acuerdo con los ODS.",
            ),
            Norm(
                name="FSSC 22000 - 2.5.16: Diseño y Desarrollo de Producto",
                category="FSSC Requisitos Adicionales (V7)",
                description="Principios de diseño para garantizar la inocuidad y sostenibilidad, incluyendo el empaque.",
            ),
            Norm(
                name="ISO 22000 - 8.5.4: Plan de Control de Peligros (HACCP/PPRO)",
                category="ISO 22000 - Operación",
                description="Establecimiento de límites críticos, monitoreo y acciones correctivas para Puntos Críticos de Control (PCC).",
            ),
            Norm(
                name="ISO 22000 - 10.2: No Conformidad y Acción Correctiva",
                category="ISO 22000 - Mejora",
                description="Reaccionar a no conformidades, evaluar la necesidad de acciones para eliminar la causa raíz y verificar la eficacia (ciclo CAP).",
            ),

        ]

        db.add_all(norms)

    db.commit()