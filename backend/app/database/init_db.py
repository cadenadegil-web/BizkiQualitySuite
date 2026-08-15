"""
Inicialización de la base de datos.

Este módulo registra todos los modelos SQLAlchemy y crea las
tablas que no existan en PostgreSQL.
"""

from app.database.base import Base
from app.database.connection import engine

# =====================================================
# Modelos del sistema
# =====================================================

from app.models.user import User
from app.models.area import Area
from app.models.classification import Classification
from app.models.status import Status

from app.models.finding import Finding
from app.models.capa import CAPA
from app.models.evidence import Evidence
from app.models.audit import Audit, AuditItem
from app.models.norm import Norm
from app.database.connection import SessionLocal

INITIAL_NORMS = [
  # BPM (Buenas Prácticas de Manufactura / GMP)
  { "norm": "BPM §4.1", "control_point": "Personal con uniforme completo, limpio y EPP adecuado", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §4.2", "control_point": "Lavado y desinfección de manos antes de iniciar operaciones y tras usar sanitarios", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §4.3", "control_point": "Ausencia de joyas, maquillaje, uñas largas o esmalte en manipuladores", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §4.4", "control_point": "Estado de salud del personal reportado (ausencia de enfermedades contagiosas o heridas abiertas)", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §5.1", "control_point": "Equipos y utensilios de material sanitario, limpios y calibrados", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §5.2", "control_point": "Mantenimiento preventivo de equipos registrado y actualizado", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §6.1", "control_point": "Registro de lote y trazabilidad completados correctamente en cada etapa", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §6.2", "control_point": "Controles de procesos térmicos (cocción, pasteurización, enfriamiento) registrados", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §6.3", "control_point": "Manejo adecuado de mermas y reprocesos", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §7.1", "control_point": "Instalaciones limpias, sin polvo, telarañas ni agua estancada", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §7.2", "control_point": "Ausencia de plagas o indicios de infestación en el área productiva", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §7.3", "control_point": "Manejo y disposición correcta de desechos sólidos y líquidos", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §8.1", "control_point": "Área de almacenamiento ordenada, limpia y señalizada", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §8.2", "control_point": "Rotación de inventarios PEPS (Primeras Entradas, Primeras Salidas)", "category": "BPM (Buenas Prácticas de Manufactura)" },
  { "norm": "BPM §8.3", "control_point": "Almacenamiento de químicos separados de materias primas e insumos", "category": "BPM (Buenas Prácticas de Manufactura)" },

  # ISO 22000 (Inocuidad Alimentaria)
  { "norm": "ISO 22000 §8.2", "control_point": "Área limpia, ordenada y libre de contaminantes físicos (vidrio, metal, madera)", "category": "ISO 22000 (Inocuidad Alimentaria)" },
  { "norm": "ISO 22000 §8.5", "control_point": "Temperatura y humedad del proceso dentro del rango crítico establecido", "category": "ISO 22000 (Inocuidad Alimentaria)" },
  { "norm": "ISO 22000 §8.5.2", "control_point": "Identificación y separación estricta de alérgenos", "category": "ISO 22000 (Inocuidad Alimentaria)" },
  { "norm": "ISO 22000 §8.8", "control_point": "Producto etiquetado correctamente con fecha de caducidad, lote y código", "category": "ISO 22000 (Inocuidad Alimentaria)" },
  { "norm": "ISO 22000 §8.9", "control_point": "Protocolo de retiro y recuperación de producto simulado o verificado", "category": "ISO 22000 (Inocuidad Alimentaria)" },
  { "norm": "ISO 22000 §9.1", "control_point": "Muestras de control de calidad tomadas y registradas para laboratorio", "category": "ISO 22000 (Inocuidad Alimentaria)" },

  # HACCP (Análisis de Peligros y Puntos Críticos)
  { "norm": "HACCP §Principio 1", "control_point": "Análisis de peligros biológicos, químicos y físicos documentado", "category": "HACCP" },
  { "norm": "HACCP §Principio 2", "control_point": "Identificación precisa de los Puntos Críticos de Control (PCC)", "category": "HACCP" },
  { "norm": "HACCP §Principio 3", "control_point": "Límites críticos establecidos y validados para cada PCC", "category": "HACCP" },
  { "norm": "HACCP §Principio 4", "control_point": "Sistema de monitoreo continuo del PCC implementado", "category": "HACCP" },
  { "norm": "HACCP Nivel 1", "control_point": "Puntos Críticos de Control (PCC) monitoreados y dentro de límites", "category": "HACCP" },
  { "norm": "HACCP Nivel 2", "control_point": "Acciones correctivas documentadas de forma inmediata ante desviaciones de PCC", "category": "HACCP" },
  { "norm": "HACCP §Principio 6", "control_point": "Procedimientos de verificación de efectividad del plan HACCP ejecutados", "category": "HACCP" },

  # ISO 9001 (Gestión de la Calidad)
  { "norm": "ISO 9001 §7.1.5", "control_point": "Recursos de seguimiento y medición con certificados de calibración vigentes", "category": "ISO 9001 (Calidad)" },
  { "norm": "ISO 9001 §7.5", "control_point": "Información documentada (POES, manuales) controlada, disponible y legible", "category": "ISO 9001 (Calidad)" },
  { "norm": "ISO 9001 §8.7", "control_point": "Control estricto de salidas no conformes (producto retenido o cuarentena)", "category": "ISO 9001 (Calidad)" },
  { "norm": "ISO 9001 §9.2", "control_point": "Resultados de auditorías internas previas atendidos y cerrados", "category": "ISO 9001 (Calidad)" },

  # Seguridad y Salud Ocupacional (ISO 45001 / Generales)
  { "norm": "SST §1.1", "control_point": "Uso obligatorio y correcto de Equipo de Protección Personal (EPP) general", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)" },
  { "norm": "SST §1.2", "control_point": "Pasillos y rutas de evacuación despejados y señalizados", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)" },
  { "norm": "SST §1.3", "control_point": "Botiquín de primeros auxilios abastecido e inspeccionado", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)" },
  { "norm": "SST §1.4", "control_point": "Extintores con carga vigente, señalizados y sin obstrucciones", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)" },
]


def create_database() -> None:
    """
    Crea todas las tablas registradas en Base.metadata.
    """
    Base.metadata.create_all(bind=engine)

    # Seed Norms
    db = SessionLocal()
    try:
        count = db.query(Norm).count()
        if count == 0:
            for n in INITIAL_NORMS:
                db.add(Norm(name=n["norm"], description=n["control_point"], category=n.get("category")))
            db.commit()
    finally:
        db.close()