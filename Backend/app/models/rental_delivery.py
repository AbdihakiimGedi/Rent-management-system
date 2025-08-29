from app.extensions import db
from datetime import datetime, timedelta
import json
import random

class RentalDelivery(db.Model):
    __tablename__ = "rental_deliveries"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False, unique=True)
    renter_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    owner_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    confirmation_code = db.Column(db.String(6), nullable=False)
    code_expiry = db.Column(db.DateTime, nullable=False)
    owner_proof = db.Column(db.Text)  # JSON list of uploaded file names or URLs
    delivered_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = db.relationship("Booking", backref=db.backref("delivery", uselist=False))

    def generate_confirmation_code(self):
        self.confirmation_code = str(random.randint(100000, 999999))
        self.code_expiry = datetime.utcnow() + timedelta(minutes=15)  # code expires in 15 mins

    def set_owner_proof(self, proof_files):
        self.owner_proof = json.dumps(proof_files)

    def get_owner_proof(self):
        if not self.owner_proof:
            return []
        return json.loads(self.owner_proof)
