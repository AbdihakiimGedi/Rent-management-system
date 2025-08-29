from app.extensions import db
from datetime import datetime, timedelta, timezone

class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    rental_item_id = db.Column(db.Integer, db.ForeignKey("rental_items.id"), nullable=False)
    renter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="Pending", nullable=False)  # Match DB: VARCHAR(20)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Payment fields (now non-nullable)
    payment_status = db.Column(db.String(20), nullable=False, default="PENDING")  # PENDING, HELD, COMPLETED, FAILED
    payment_method = db.Column(db.String(50), nullable=False)  # EVC_PLUS, BANK, etc.
    payment_amount = db.Column(db.Float, nullable=False)  # Match DB: FLOAT
    service_fee = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)  # Match DB: DECIMAL(10,2)
    payment_account = db.Column(db.String(100), nullable=False)  # Account number/ID
    
    # Payment holding system fields
    payment_held_at = db.Column(db.DateTime, nullable=True)  # When payment was held
    payment_released_at = db.Column(db.DateTime, nullable=True)  # When payment was released
    admin_approved = db.Column(db.Boolean, nullable=True)  # Admin approval status
    admin_approved_at = db.Column(db.DateTime, nullable=True)  # When admin approved
    admin_rejection_reason = db.Column(db.Text, nullable=True)  # Reason for rejection
    
    # Contract fields
    contract_accepted = db.Column(db.Boolean, nullable=False)  # Match DB: TINYINT
    contract_accepted_at = db.Column(db.DateTime, nullable=True)  # Match DB: DATETIME
    
    # Requirements data
    requirements_data = db.Column(db.Text, nullable=True)
    
    # Delivery fields
    delivered_at = db.Column(db.DateTime, nullable=True)
    renter_confirmed = db.Column(db.Boolean, nullable=True)  # Match DB: TINYINT
    owner_confirmed = db.Column(db.Boolean, nullable=True)  # Match DB: TINYINT
    
    # Owner confirmation fields (NEW)
    owner_confirmation_status = db.Column(db.String(20), default="PENDING", nullable=False)  # PENDING, ACCEPTED, REJECTED
    owner_confirmed_at = db.Column(db.DateTime, nullable=True)
    owner_rejection_reason = db.Column(db.Text, nullable=True)
    
    # Confirmation code fields (NEW)
    confirmation_code = db.Column(db.String(6), nullable=True)
    code_expiry = db.Column(db.DateTime, nullable=True)
    renter_confirmed_at = db.Column(db.DateTime, nullable=True)
    
    # 24-hour timer fields (NEW)
    owner_acceptance_time = db.Column(db.DateTime, nullable=True)  # When owner accepted
    user_confirmation_deadline = db.Column(db.DateTime, nullable=True)  # 24 hours after acceptance
    
    # Penalty fields
    penalty_applied = db.Column(db.Boolean, nullable=True)  # Match DB: TINYINT
    owner_rating_penalty = db.Column(db.Integer, nullable=True)  # Match DB: INTEGER
    
    # Relationships
    rental_item = db.relationship("RentalItem", backref=db.backref("bookings", lazy=True))
    renter = db.relationship("User", foreign_keys=[renter_id], backref=db.backref("renter_bookings", lazy=True))

    # ------------------- Methods -------------------
    def get_requirements_data(self):
        """Get the requirements data as a dictionary"""
        if self.requirements_data:
            try:
                import json
                return json.loads(self.requirements_data)
            except Exception as e:
                print(f"[BOOKING_MODEL] Warning: Could not parse requirements_data: {e}")
                return {}
        return {}

    def set_requirements_data(self, data):
        """Set the requirements data as JSON string"""
        if data:
            try:
                import json
                self.requirements_data = json.dumps(data)
            except Exception as e:
                print(f"[BOOKING_MODEL] Warning: Could not serialize requirements_data: {e}")
                self.requirements_data = None
        else:
            self.requirements_data = None

    def generate_receipt(self):
        try:
            print(f"[BOOKING_MODEL] 🔍 Generating receipt for booking {self.id}")
            
            # Check if rental_item exists
            if not self.rental_item:
                print(f"[BOOKING_MODEL] ❌ No rental_item found for booking {self.id}")
                raise Exception("Rental item not found for this booking")
            
            # Check if owner exists
            if not hasattr(self.rental_item, 'owner') or not self.rental_item.owner:
                print(f"[BOOKING_MODEL] ❌ No owner found for rental_item {self.rental_item.id}")
                raise Exception("Owner not found for this rental item")
            
            # Check if renter exists
            if not self.renter:
                print(f"[BOOKING_MODEL] ❌ No renter found for booking {self.id}")
                raise Exception("Renter not found for this booking")
            
            print(f"[BOOKING_MODEL] ✅ All relationships verified")
            
            receipt = {
                "booking_id": self.id,
                "renter": {
                    "id": self.renter.id,
                    "username": self.renter.username,
                    "email": self.renter.email
                },
                "owner": {
                    "id": self.rental_item.owner.id,
                    "username": self.rental_item.owner.username,
                    "email": self.rental_item.owner.email
                },
                "rental_item": {
                    "id": self.rental_item.id,
                    "name": self.rental_item.get_dynamic_data().get('Item Name', 'Unknown Item'),
                    "category": self.rental_item.category.name if self.rental_item.category else 'Unknown Category'
                },
                "status": self.status,
                "payment_status": self.payment_status,
                "payment_amount": self.payment_amount,
                "service_fee": float(self.service_fee) if self.service_fee else 0,
                "total_amount": float(self.payment_amount) + float(self.service_fee) if self.service_fee else float(self.payment_amount),
                "net_owner": float(self.payment_amount) - float(self.service_fee) if self.service_fee else float(self.payment_amount),
                "payment_method": getattr(self, 'payment_method', 'Not specified'),
                "payment_account": getattr(self, 'payment_account', 'Not specified'),
                "payment_released_at": getattr(self, 'payment_released_at', None),
                "contract_accepted": self.contract_accepted,
                "created_at": self.created_at,
                "updated_at": self.updated_at
            }
            
            print(f"[BOOKING_MODEL] ✅ Receipt generated successfully with {len(receipt)} fields")
            return receipt
            
        except Exception as e:
            print(f"[BOOKING_MODEL] ❌ Error generating receipt: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e

    def hold_payment(self):
        """Hold the payment in the system"""
        self.payment_status = "HELD"
        self.payment_held_at = datetime.utcnow()
        self.status = "Payment_Held"
        return True

    def release_payment(self, admin_approved=True, rejection_reason=None):
        """Release the payment (approve or reject)"""
        if admin_approved:
            self.payment_status = "COMPLETED"
            self.status = "Confirmed"
            self.admin_approved = True
            self.admin_approved_at = datetime.now(timezone.utc)
            self.payment_released_at = datetime.now(timezone.utc)
            
            # Log revenue tracking for approved payments
            print(f"[REVENUE] ✅ Payment APPROVED for booking #{self.id}")
            print(f"[REVENUE] 💰 Payment to owner: ${self.payment_amount}")
            print(f"[REVENUE] 🏦 Service fee to admin: ${self.service_fee}")
            print(f"[REVENUE] 📊 Admin revenue generated: ${self.service_fee}")
            print(f"[REVENUE] 📈 Total money processed: ${float(self.payment_amount) + float(self.service_fee)}")
            print(f"[REVENUE] ✅ Status: {self.status}, Payment: {self.payment_status}")
        else:
            self.payment_status = "FAILED"
            self.status = "Rejected"
            self.admin_approved = False
            self.admin_rejection_reason = rejection_reason
            self.payment_released_at = datetime.now(timezone.utc)
            
            # Log revenue tracking for rejected payments
            print(f"[REVENUE] ❌ Payment REJECTED for booking #{self.id}")
            print(f"[REVENUE] 💸 No admin revenue generated - payment refunded")
            print(f"[REVENUE] 🔄 Service fee refunded: ${self.service_fee}")
        return True

    def is_payment_completed(self):
        """Check if payment is completed and booking is active"""
        return self.payment_status == "COMPLETED" and self.status == "Confirmed"

    def can_be_rented(self):
        """Check if this item can be rented (not already booked with completed payment)"""
        return not self.is_payment_completed()

    # ------------------- NEW METHODS FOR OWNER CONFIRMATION WORKFLOW -------------------
    
    def generate_confirmation_code(self):
        """Generate a 6-digit confirmation code and set expiry"""
        import random
        
        self.confirmation_code = str(random.randint(100000, 999999))
        self.code_expiry = datetime.now(timezone.utc) + timedelta(hours=24)
        self.owner_acceptance_time = datetime.now(timezone.utc)
        self.user_confirmation_deadline = datetime.now(timezone.utc) + timedelta(hours=24)
        return self.confirmation_code
    
    def owner_accept_booking(self):
        """Owner accepts the booking - generates confirmation code"""
        self.owner_confirmation_status = "ACCEPTED"
        self.owner_confirmed_at = datetime.now(timezone.utc)
        self.status = "Owner_Accepted"
        confirmation_code = self.generate_confirmation_code()
        return confirmation_code
    
    def owner_reject_booking(self, reason=None):
        """Owner rejects the booking - triggers refund process"""
        self.owner_confirmation_status = "REJECTED"
        self.owner_rejection_reason = reason
        self.status = "Owner_Rejected"
        self.payment_status = "FAILED"
        # Note: Refund logic will be handled in payment routes
        return True
    
    def user_confirm_delivery(self, code):
        """User confirms delivery with confirmation code"""
        print(f"[BOOKING_MODEL] 🔐 user_confirm_delivery called with code: {code}")
        print(f"[BOOKING_MODEL] 🔍 Current confirmation_code: {self.confirmation_code}")
        print(f"[BOOKING_MODEL] 🔍 Current code_expiry: {self.code_expiry}")
        print(f"[BOOKING_MODEL] 🔍 Current time: {datetime.now(timezone.utc)}")
        print(f"[BOOKING_MODEL] 🔍 Code comparison: '{self.confirmation_code}' == '{code}' -> {self.confirmation_code == code}")
        
        if not self.confirmation_code or self.confirmation_code != code:
            print(f"[BOOKING_MODEL] ❌ Invalid confirmation code: expected='{self.confirmation_code}', received='{code}'")
            return False, "Invalid confirmation code"
        
        # Normalize expiry to timezone-aware UTC for safe comparison
        expiry = self.code_expiry
        if not expiry:
            print(f"[BOOKING_MODEL] ❌ Missing code_expiry")
            return False, "Confirmation code expired"
        if expiry.tzinfo is None or expiry.tzinfo.utcoffset(expiry) is None:
            try:
                expiry = expiry.replace(tzinfo=timezone.utc)
            except Exception as _e:
                pass
        if datetime.now(timezone.utc) > expiry:
            print(f"[BOOKING_MODEL] ❌ Confirmation code expired: {self.code_expiry}")
            return False, "Confirmation code expired"
        
        print(f"[BOOKING_MODEL] ✅ Confirmation code validation passed")
        self.renter_confirmed = True
        self.renter_confirmed_at = datetime.now(timezone.utc)
        print(f"[BOOKING_MODEL] ✅ User confirmation set to True")
        return True, "Delivery confirmed successfully"
    
    def owner_confirm_delivery(self, code):
        """Owner confirms delivery with confirmation code"""
        print(f"[BOOKING_MODEL] 🔐 owner_confirm_delivery called with code: {code}")
        print(f"[BOOKING_MODEL] 🔍 Current confirmation_code: {self.confirmation_code}")
        print(f"[BOOKING_MODEL] 🔍 Current code_expiry: {self.code_expiry}")
        print(f"[BOOKING_MODEL] 🔍 Current time: {datetime.now(timezone.utc)}")
        
        if not self.confirmation_code or self.confirmation_code != code:
            print(f"[BOOKING_MODEL] ❌ Invalid confirmation code: expected={self.confirmation_code}, received={code}")
            return False, "Invalid confirmation code"
        
        # Normalize expiry to timezone-aware UTC for safe comparison
        expiry = self.code_expiry
        if not expiry:
            return False, "Confirmation code expired"
        if expiry.tzinfo is None or expiry.tzinfo.utcoffset(expiry) is None:
            try:
                expiry = expiry.replace(tzinfo=timezone.utc)
            except Exception:
                pass
        if datetime.now(timezone.utc) > expiry:
            print(f"[BOOKING_MODEL] ❌ Confirmation code expired: {self.code_expiry}")
            return False, "Confirmation code expired"
        
        print(f"[BOOKING_MODEL] ✅ Confirmation code validation passed")
        self.owner_confirmed = True
        self.owner_confirmed_at = datetime.now(timezone.utc)
        print(f"[BOOKING_MODEL] ✅ Owner confirmation set to True")
        return True, "Delivery confirmed successfully"
    
    def can_owner_confirm_alone(self):
        """Check if owner can confirm delivery - only if user has confirmed first"""
        # Owner can only confirm if user has already confirmed
        return self.renter_confirmed
    
    def can_owner_confirm_now(self):
        """Check if owner can confirm delivery right now"""
        # Owner can confirm if user has confirmed OR if 24 hours have passed since acceptance
        if self.renter_confirmed:
            return True
        
        # Check if 24 hours have passed since owner acceptance
        if self.owner_acceptance_time:
            from datetime import datetime
            acceptance_time = self.owner_acceptance_time
            if acceptance_time.tzinfo is None or acceptance_time.tzinfo.utcoffset(acceptance_time) is None:
                try:
                    acceptance_time = acceptance_time.replace(tzinfo=timezone.utc)
                except Exception:
                    pass
            hours_passed = (datetime.now(timezone.utc) - acceptance_time).total_seconds() / 3600
            return hours_passed >= 24
        
        return False
    
    def is_delivery_complete(self):
        """Check if both parties have confirmed delivery"""
        return self.renter_confirmed and self.owner_confirmed
    
    def should_auto_release_payment(self):
        """Check if payment should be automatically released"""
        return self.is_delivery_complete() and self.payment_status == "HELD"
