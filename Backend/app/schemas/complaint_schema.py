from marshmallow import Schema, fields, validate

class ComplaintSchema(Schema):
    id = fields.Int(dump_only=True)
    booking_id = fields.Int(required=True)
    complainant_id = fields.Int(required=True)
    defendant_id = fields.Int(required=True)
    complaint_type = fields.Str(required=True, validate=validate.OneOf(["Service Quality", "Payment Issue", "Behavior", "Other"]))
    description = fields.Str(required=True, validate=validate.Length(min=10, max=1000))
    status = fields.Str(dump_only=True, dump_default="Pending")
    admin_notes = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class ComplaintUpdateSchema(Schema):
    description = fields.Str(validate=validate.Length(min=10, max=1000))

