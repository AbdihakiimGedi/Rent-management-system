from app.extensions import db
from app.models.RentalItem  import RentalItem
from app.models.category_requirement import CategoryRequirement

class RentalItemAnswer(db.Model):
    __tablename__ = 'rental_item_answers'

    id = db.Column(db.Integer, primary_key=True)
    rental_item_id = db.Column(db.Integer, db.ForeignKey('rental_items.id'), nullable=False)
    requirement_id = db.Column(db.Integer, db.ForeignKey('category_requirements.id'), nullable=False)
    value = db.Column(db.Text, nullable=False)  # Can hold text, numbers, image paths, etc.

    # Relationships
    rental_item = db.relationship("RentalItem", backref=db.backref("answers", lazy=True))
    requirement = db.relationship("CategoryRequirement", backref=db.backref("answers", lazy=True))

    def __repr__(self):
        return f"<Answer for Item {self.rental_item_id}, Field {self.requirement_id}>"
