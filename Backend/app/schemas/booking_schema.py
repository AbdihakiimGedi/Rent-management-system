from marshmallow import Schema, fields, validate, ValidationError
from marshmallow import validates_schema

class InitialBookingSchema(Schema):
    """Schema for initial booking submission (before payment)"""
    rental_item_id = fields.Int(required=True)
    requirements_data = fields.Dict(required=True)
    contract_accepted = fields.Boolean(required=True)

    @validates_schema
    def validate_contract(self, data, **kwargs):
        if not data.get("contract_accepted", False):
            raise ValidationError("You must accept the contract to submit a booking.")

class BookingSchema(Schema):
    """Schema for complete booking with payment details"""
    rental_item_id = fields.Int(required=True)
    renter_id = fields.Int(dump_only=True)
    owner_id = fields.Int(dump_only=True)
    requirements_data = fields.Dict(required=True)
    contract_accepted = fields.Boolean(required=True)
    status = fields.Str(dump_only=True, dump_default="Pending")
    payment_status = fields.Str(dump_only=True, dump_default="HELD")
    payment_amount = fields.Decimal(required=True, places=2)
    service_fee = fields.Decimal(dump_only=True, places=2, dump_default=0)
    payment_method = fields.Str(required=True, validate=validate.OneOf(["EVC_PLUS", "BANK"]))
    payment_account = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    released_at = fields.DateTime(dump_only=True)
    penalty_applied = fields.Bool(dump_only=True, dump_default=False)
    owner_rating_penalty = fields.Int(dump_only=True, dump_default=0)
    delivered_at = fields.DateTime(dump_only=True)
    renter_confirmed = fields.Bool(dump_only=True, dump_default=False)
    owner_confirmed = fields.Bool(dump_only=True, dump_default=False)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates_schema
    def validate_contract(self, data, **kwargs):
        if not data.get("contract_accepted", False):
            raise ValidationError("You must accept the contract to submit a booking.")
