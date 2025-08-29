from app.extensions import db
from datetime import datetime, timedelta

class UserRestriction(db.Model):
    __tablename__ = "user_restrictions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    complaints_count = db.Column(db.Integer, default=0)
    warning_count = db.Column(db.Integer, default=0)
    restricted = db.Column(db.Boolean, default=False)
    blocked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("restriction", uselist=False))

    # ------------------- Methods -------------------
    def add_complaint(self):
        self.complaints_count += 1
        if self.complaints_count >= 3:
            self.restricted = True
            self.blocked_until = datetime.utcnow() + timedelta(days=30)  # Example: auto-block 30 days

    def add_warning(self):
        self.warning_count += 1

    def unblock(self):
        self.restricted = False
        self.complaints_count = 0
        self.warning_count = 0
        self.blocked_until = None
