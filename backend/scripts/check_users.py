from app.database.session import SessionLocal
from app.models.user import User
import app.database.init_db

if __name__ == "__main__":
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("Total usuarios:", len(users))
        for u in users:
            print(f"- {u.username} (Rol: {u.role}, Activo: {u.is_active})")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()
