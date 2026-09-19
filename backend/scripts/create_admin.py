from app.database.session import SessionLocal
from app.schemas.user import UserCreate
from app.services.user_service import create_user
from app.database.init_db import create_database
from app.database.seed import seed_database

if __name__ == "__main__":
    # Asegurar que las tablas estén creadas en la base de datos
    create_database()
    
    db = SessionLocal()
    
    # Sembrar catálogos (Áreas, Clasificaciones, Estados)
    try:
        seed_database(db)
        print("Catálogos sembrados correctamente.")
    except Exception as e:
        print("Error al sembrar catálogos:", e)
        
    user = UserCreate(
        full_name="Administrador",
        username="admin",
        email="admin@example.com",
        password="admin123",
        role="administrador",
        is_active=True,
    )
    try:
        created = create_user(db, user)
        print("Usuario creado:", created.username)
    except Exception as e:
        print("Error creando usuario (puede que ya exista):", e)
    finally:
        db.close()
