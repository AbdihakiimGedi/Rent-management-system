from app.extensions import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=True)  # Add type field for notification categorization
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to User
    user = db.relationship("User", backref=db.backref("notifications", lazy=True))

    # ------------------- Helper Methods -------------------
    def mark_as_read(self):
        """Mark this notification as read."""
        self.read = True
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        """Return dictionary representation for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "message": self.message,
            "type": self.type,
            "read": self.read,
            "created_at": self.created_at
        }
