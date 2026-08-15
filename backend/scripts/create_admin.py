from app.database.session import SessionLocal
from app.schemas.user import UserCreate
from app.services.user_service import create_user

if __name__ == "__main__":
    db = SessionLocal()
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
        print("Error creando usuario:", e)
    finally:
        db.close()
