"""
Inicialización de la base de datos.

Este módulo registra todos los modelos SQLAlchemy y crea las
tablas que no existan en PostgreSQL sin bloquear el arranque en Render.
"""

from sqlalchemy import func, text

from app.database.base import Base
from app.database.connection import SessionLocal, engine

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

INITIAL_NORMS = [
    # BPM (Buenas Prácticas de Manufactura / GMP)
    {"norm": "BPM §4.1", "control_point": "Personal con uniforme completo, limpio y EPP adecuado", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §4.2", "control_point": "Lavado y desinfección de manos antes de iniciar operaciones y tras usar sanitarios", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §4.3", "control_point": "Ausencia de joyas, maquillaje, uñas largas o esmalte en manipuladores", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §4.4", "control_point": "Estado de salud del personal reportado (ausencia de enfermedades contagiosas o heridas abiertas)", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §5.1", "control_point": "Equipos y utensilios de material sanitario, limpios y calibrados", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §5.2", "control_point": "Mantenimiento preventivo de equipos registrado y actualizado", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §6.1", "control_point": "Registro de lote y trazabilidad completados correctamente en cada etapa", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §6.2", "control_point": "Controles de procesos térmicos (cocción, pasteurización, enfriamiento) registrados", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §6.3", "control_point": "Manejo adecuado de mermas y reprocesos", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §7.1", "control_point": "Instalaciones limpias, sin polvo, telarañas ni agua estancada", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §7.2", "control_point": "Ausencia de plagas o indicios de infestación en el área productiva", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §7.3", "control_point": "Manejo y disposición correcta de desechos sólidos y líquidos", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §8.1", "control_point": "Área de almacenamiento ordenada, limpia y señalizada", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §8.2", "control_point": "Rotación de inventarios PEPS (Primeras Entradas, Primeras Salidas)", "category": "BPM (Buenas Prácticas de Manufactura)"},
    {"norm": "BPM §8.3", "control_point": "Almacenamiento de químicos separados de materias primas e insumos", "category": "BPM (Buenas Prácticas de Manufactura)"},
    # ISO 22000 (Inocuidad Alimentaria)
    {"norm": "ISO 22000 §8.2", "control_point": "Área limpia, ordenada y libre de contaminantes físicos (vidrio, metal, madera)", "category": "ISO 22000 (Inocuidad Alimentaria)"},
    {"norm": "ISO 22000 §8.5", "control_point": "Temperatura y humedad del proceso dentro del rango crítico establecido", "category": "ISO 22000 (Inocuidad Alimentaria)"},
    {"norm": "ISO 22000 §8.5.2", "control_point": "Identificación y separación estricta de alérgenos", "category": "ISO 22000 (Inocuidad Alimentaria)"},
    {"norm": "ISO 22000 §8.8", "control_point": "Producto etiquetado correctamente con fecha de caducidad, lote y código", "category": "ISO 22000 (Inocuidad Alimentaria)"},
    {"norm": "ISO 22000 §8.9", "control_point": "Protocolo de retiro y recuperación de producto simulado o verificado", "category": "ISO 22000 (Inocuidad Alimentaria)"},
    {"norm": "ISO 22000 §9.1", "control_point": "Muestras de control de calidad tomadas y registradas para laboratorio", "category": "ISO 22000 (Inocuidad Alimentaria)"},
    # HACCP (Análisis de Peligros y Puntos Críticos)
    {"norm": "HACCP §Principio 1", "control_point": "Análisis de peligros biológicos, químicos y físicos documentado", "category": "HACCP"},
    {"norm": "HACCP §Principio 2", "control_point": "Identificación precisa de los Puntos Críticos de Control (PCC)", "category": "HACCP"},
    {"norm": "HACCP §Principio 3", "control_point": "Límites críticos establecidos y validados para cada PCC", "category": "HACCP"},
    {"norm": "HACCP §Principio 4", "control_point": "Sistema de monitoreo continuo del PCC implementado", "category": "HACCP"},
    {"norm": "HACCP Nivel 1", "control_point": "Puntos Críticos de Control (PCC) monitoreados y dentro de límites", "category": "HACCP"},
    {"norm": "HACCP Nivel 2", "control_point": "Acciones correctivas documentadas de forma inmediata ante desviaciones de PCC", "category": "HACCP"},
    {"norm": "HACCP §Principio 6", "control_point": "Procedimientos de verificación de efectividad del plan HACCP ejecutados", "category": "HACCP"},
    # ISO 9001 (Gestión de la Calidad)
    {"norm": "ISO 9001 §7.1.5", "control_point": "Recursos de seguimiento y medición con certificados de calibración vigentes", "category": "ISO 9001 (Calidad)"},
    {"norm": "ISO 9001 §7.5", "control_point": "Información documentada (POES, manuales) controlada, disponible y legible", "category": "ISO 9001 (Calidad)"},
    {"norm": "ISO 9001 §8.7", "control_point": "Control estricto de salidas no conformes (producto retenido o cuarentena)", "category": "ISO 9001 (Calidad)"},
    {"norm": "ISO 9001 §9.2", "control_point": "Resultados de auditorías internas previas atendidos y cerrados", "category": "ISO 9001 (Calidad)"},
    # Seguridad y Salud Ocupacional (ISO 45001 / Generales)
    {"norm": "SST §1.1", "control_point": "Uso obligatorio y correcto de Equipo de Protección Personal (EPP) general", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)"},
    {"norm": "SST §1.2", "control_point": "Pasillos y rutas de evacuación despejados y señalizados", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)"},
    {"norm": "SST §1.3", "control_point": "Botiquín de primeros auxilios abastecido e inspeccionado", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)"},
    {"norm": "SST §1.4", "control_point": "Extintores con carga vigente, señalizados y sin obstrucciones", "category": "SST (Salud y Seguridad en el Trabajo / ISO 45001)"},
]


def _run_safe_ddl(statement: str) -> None:
    """Ejecuta una sentencia DDL con lock_timeout corto en su propia transacción."""
    try:
        with engine.begin() as conn:
            conn.execute(text("SET LOCAL lock_timeout = '3s';"))
            conn.execute(text("SET LOCAL statement_timeout = '10s';"))
            conn.execute(text(statement))
    except Exception as e:
        print(f"Aviso DDL ({statement[:45]}...): {e}")


def create_database() -> None:
    """
    Crea todas las tablas registradas en Base.metadata y aplica
    migraciones seguras de columnas nuevas sin bloquear despliegues.
    """
    # Liberar posibles bloqueos colgados de despliegues previos en PostgreSQL
    _run_safe_ddl(
        """
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
          AND (
              state = 'idle in transaction'
              OR (state = 'active' AND now() - query_start > interval '15 seconds')
          );
        """
    )

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Aviso en create_all: {e}")

    # Migraciones seguras individuales (cada una en su propia transacción con lock_timeout)
    ddl_statements = [
        "ALTER TABLE areas ADD COLUMN IF NOT EXISTS plant VARCHAR(100);",
        "ALTER TABLE findings ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES audits(id) ON DELETE SET NULL;",
        "ALTER TABLE findings ADD COLUMN IF NOT EXISTS audit_item_id UUID REFERENCES audit_items(id) ON DELETE SET NULL;",
        "ALTER TABLE audits ADD COLUMN IF NOT EXISTS measurement_objective VARCHAR(255);",
        "ALTER TABLE audits ADD COLUMN IF NOT EXISTS plant VARCHAR(100);",
        "ALTER TABLE audits ADD COLUMN IF NOT EXISTS area_responsible VARCHAR(150);",
        "ALTER TABLE audits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;",
        "ALTER TABLE audit_items ADD COLUMN IF NOT EXISTS objective VARCHAR(100);",
        """
        UPDATE audits au
        SET plant = COALESCE(ar.plant, 'MDH')
        FROM areas ar
        WHERE au.area_id = ar.id AND (au.plant IS NULL OR au.plant = '' OR au.plant = 'Bizki');
        """,
        """
        UPDATE areas a
        SET plant = 'MDH'
        WHERE (a.plant IS NULL OR a.plant = 'Bizki')
          AND NOT EXISTS (
              SELECT 1 FROM areas b WHERE b.name = a.name AND b.plant = 'MDH' AND b.id <> a.id
          );
        """,
    ]
    for stmt in ddl_statements:
        _run_safe_ddl(stmt)

    # Seed Norms, Catalogs and Admin
    db = SessionLocal()
    try:
        from app.services.audit_service import classify_item_objective
        unclassified_items = (
            db.query(AuditItem)
            .filter((AuditItem.objective.is_(None)) | (AuditItem.objective == ""))
            .all()
        )
        if unclassified_items:
            for item in unclassified_items:
                item.objective = classify_item_objective(item.norm, item.control_point)
            db.commit()

        audits_to_update = (
            db.query(Audit)
            .filter((Audit.measurement_objective.is_(None)) | (Audit.measurement_objective == ""))
            .all()
        )
        if audits_to_update:
            for audit in audits_to_update:
                objs = []
                for it in audit.items:
                    if it.objective and it.objective not in objs:
                        objs.append(it.objective)
                if objs:
                    audit.measurement_objective = ", ".join(objs)
            db.commit()

        count = db.query(Norm).count()
        if count == 0:
            for n in INITIAL_NORMS:
                db.add(Norm(name=n["norm"], description=n["control_point"], category=n.get("category")))
            db.commit()

        from app.database.seed import seed_database
        seed_database(db)

        from app.security.password import hash_password
        admin = db.query(User).filter(func.lower(User.username) == "admin").first()
        if not admin:
            admin = User(
                full_name="Administrador del Sistema",
                username="admin",
                email="admin@MDH.com",
                password_hash=hash_password("admin123"),
                role="administrador",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("Usuario 'admin' creado exitosamente.")
        else:
            if not admin.is_active:
                admin.is_active = True
                db.commit()
            print("Usuario 'admin' verificado.")
    except Exception as e:
        print(f"Aviso durante seed inicial: {e}")
        db.rollback()
    finally:
        db.close()
