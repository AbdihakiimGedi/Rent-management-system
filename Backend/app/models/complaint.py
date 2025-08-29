from app.extensions import db
from datetime import datetime

class Complaint(db.Model):
    __tablename__ = "complaints"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    complainant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    defendant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    complaint_type = db.Column(db.String(50), nullable=False)  # Owner / Renter / Other
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="Pending", nullable=False)  # Pending / Resolved / Rejected
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    booking = db.relationship("Booking", backref=db.backref("complaints", lazy=True))
    complainant = db.relationship("User", foreign_keys=[complainant_id])
    defendant = db.relationship("User", foreign_keys=[defendant_id])
