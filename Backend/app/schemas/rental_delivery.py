from marshmallow import Schema, fields, post_load, ValidationError
from datetime import datetime

class RentalDeliverySchema(Schema):
    id = fields.Int(dump_only=True)
    booking_id = fields.Int(required=True)
    confirmation_code = fields.Str(dump_only=True)
    code_expires_at = fields.DateTime(dump_only=True)
    renter_confirmed = fields.Bool(dump_only=True)
    renter_confirmed_at = fields.DateTime(dump_only=True)
    owner_confirmed = fields.Bool(dump_only=True)
    owner_confirmed_at = fields.DateTime(dump_only=True)
    fallback_proof = fields.Str(dump_only=True)  # store as JSON string or URLs
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Optionally validate booking_id exists on load
    @post_load
    def validate_booking(self, data, **kwargs):
        # Add booking existence check here if needed
        return data
