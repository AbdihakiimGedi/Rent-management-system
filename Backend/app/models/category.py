from app.extensions  import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    # Relationship to requirements
    requirements = db.relationship("CategoryRequirement", backref="category", cascade="all, delete-orphan")
