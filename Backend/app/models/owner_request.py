from app.extensions  import db
from datetime import datetime
from sqlalchemy.dialects.mysql import LONGTEXT
import json

class OwnerRequest(db.Model):
    __tablename__ = "owner_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(
        db.Enum("Pending", "Approved", "Rejected"), default="Pending", nullable=False
    )
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.String(255), nullable=True)
    requirements_data = db.Column(LONGTEXT, nullable=False)  # store dynamic fields as JSON

    # Relationship
    user = db.relationship("User", backref=db.backref("owner_request", uselist=False))

    def set_requirements_data(self, data):
        """Store Python dict as JSON string"""
        self.requirements_data = json.dumps(data)

    def get_requirements_data(self):
        """Return JSON string as Python dict"""
        return json.loads(self.requirements_data)
