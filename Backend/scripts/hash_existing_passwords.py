
from app.extensions import db, bcrypt
from app.models.user import User

def hash_existing_passwords():
    users = User.query.all()
    for user in users:
        # Only hash if not already hashed (basic check)
        if not user.password.startswith("$2b$"):
            hashed = bcrypt.generate_password_hash(user.password).decode("utf-8")
            user.password = hashed
            print(f"Hashed password for user: {user.username}")
    db.session.commit()
    print("All existing passwords have been hashed.")

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        hash_existing_passwords()
