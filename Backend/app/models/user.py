from app.extensions import db, bcrypt
from flask_login import UserMixin

class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(9), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    address = db.Column(db.String(200), nullable=False)
    birthdate = db.Column(db.Date, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)   # hashed password stored here
    role = db.Column(db.String(20), default="user")  # user, owner, admin
    is_active = db.Column(db.Boolean, default=True, nullable=True)
    created_at = db.Column(db.DateTime, nullable=True)
    is_restricted = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships (commented to avoid circular import issues if needed)
    # rental_items = db.relationship("RentalItem", backref="owner", lazy=True)

    def set_password(self, password):
        """Hash and store the password in the 'password' field."""
        self.password = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Verify a plaintext password against the stored hash."""
        return bcrypt.check_password_hash(self.password, password)

    def __repr__(self):
        return f"<User {self.username}>"
