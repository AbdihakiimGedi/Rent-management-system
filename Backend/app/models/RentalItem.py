from app.extensions import db
from datetime import datetime, timezone
import json

class RentalItem(db.Model):
    __tablename__ = "rental_items"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    
    # Status and availability
    is_available = db.Column(db.Boolean, default=True)
    
    # Dynamic data storage (for category requirements that owner filled out)
    dynamic_data = db.Column(db.Text, nullable=True)  # JSON storage for owner's submitted values
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = db.relationship("User", foreign_keys=[owner_id], backref=db.backref("owned_rental_items", lazy=True))
    category = db.relationship("Category", backref=db.backref("rental_items", lazy=True))
    
    # Dynamic requirements for renters
    renter_requirements = db.relationship("RenterInputField", backref="rental_item", cascade="all, delete-orphan")

    def get_dynamic_data(self):
        """Get parsed dynamic data from JSON - returns owner's submitted values"""
        if self.dynamic_data:
            try:
                return json.loads(self.dynamic_data)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    def set_dynamic_data(self, data):
        """Set dynamic data as JSON string - stores owner's submitted values"""
        if data is not None:
            self.dynamic_data = json.dumps(data)
        else:
            self.dynamic_data = None

    def add_dynamic_field_value(self, field_name, value):
        """Add or update a single dynamic field value"""
        current_data = self.get_dynamic_data()
        current_data[field_name] = value
        self.set_dynamic_data(current_data)

    def get_dynamic_field_value(self, field_name, default=None):
        """Get a specific dynamic field value"""
        data = self.get_dynamic_data()
        return data.get(field_name, default)

    def remove_dynamic_field(self, field_name):
        """Remove a specific dynamic field"""
        current_data = self.get_dynamic_data()
        if field_name in current_data:
            del current_data[field_name]
            self.set_dynamic_data(current_data)

    def get_basic_data(self):
        """Get basic item information including dynamic data"""
        return {
            "id": self.id,
            "owner_id": self.owner_id,
            "category_id": self.category_id,
            "is_available": self.is_available,
            "dynamic_data": self.get_dynamic_data(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def get_full_data(self):
        """Get complete item information including relationships and dynamic data"""
        basic_data = self.get_basic_data()
        basic_data.update({
            "owner": {
                "id": self.owner.id,
                "username": self.owner.username,
                "email": self.owner.email
            } if self.owner else None,
            "category": {
                "id": self.category.id,
                "name": self.category.name,
                "description": self.category.description
            } if self.category else None,
            "renter_requirements_count": len(self.renter_requirements) if self.renter_requirements else 0,
            "dynamic_fields_count": len(self.get_dynamic_data())
        })
        return basic_data

    def check_availability(self):
        """Check if the rental item is available for booking"""
        # Check if the item is marked as available
        if not self.is_available:
            return False
        
        # Check if there are any active bookings for this item
        from app.models.booking import Booking
        
        # Look for active bookings (HELD or COMPLETED status)
        active_bookings = Booking.query.filter_by(
            rental_item_id=self.id
        ).filter(
            Booking.payment_status.in_(["HELD", "COMPLETED"])
        ).first()
        
        # If there are active bookings, the item is not available
        if active_bookings:
            return False
        
        return True

    def mark_as_unavailable(self):
        """Mark the rental item as unavailable"""
        self.is_available = False
        self.updated_at = datetime.now(timezone.utc)

    def mark_as_available(self):
        """Mark the rental item as available"""
        self.is_available = True
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        return f'<RentalItem {self.id} - Owner: {self.owner_id}, Category: {self.category_id}>'
