from marshmallow import Schema, fields, validate

class ReceiptSchema(Schema):
    id = fields.Int(dump_only=True)
    payment_id = fields.Int(required=True)
    amount = fields.Decimal(required=True, places=2)
    currency = fields.Str(required=True, validate=validate.OneOf(["USD", "EUR", "GBP"]))
    payment_method = fields.Str(required=True)
    transaction_id = fields.Str(required=True)
    receipt_number = fields.Str(dump_only=True)
    format = fields.Str(validate=validate.OneOf(["pdf"]), load_default="pdf")
    created_at = fields.DateTime(dump_only=True)

class ReceiptDownloadSchema(Schema):
    format = fields.Str(validate=validate.OneOf(["pdf"]), load_default="pdf")

