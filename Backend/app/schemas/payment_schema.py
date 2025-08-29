from marshmallow import Schema, fields, validate

class PaymentSchema(Schema):
    id = fields.Int(dump_only=True)
    booking_id = fields.Int(required=True)
    user_id = fields.Int(required=True)
    owner_id = fields.Int(required=True)
    amount = fields.Decimal(required=True, places=2)
    payment_method = fields.Str(required=True, validate=validate.OneOf(["EVC_PLUS", "BANK"]))
    payment_status = fields.Str(dump_only=True, dump_default="Pending")
    transaction_id = fields.Str()
    notes = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class PaymentUpdateSchema(Schema):
    payment_status = fields.Str(required=True, validate=validate.OneOf(["Pending", "Completed", "Failed", "Cancelled"]))
    transaction_id = fields.Str()
    notes = fields.Str()

