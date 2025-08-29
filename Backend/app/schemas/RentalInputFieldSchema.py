from marshmallow import Schema, fields, validate, ValidationError

VALID_FIELD_TYPES = ["string", "number", "date", "file", "selection"]

def validate_field_type(value):
    if value not in VALID_FIELD_TYPES:
        raise ValidationError(f"Invalid field type. Must be one of {VALID_FIELD_TYPES}")

class RenterInputFieldSchema(Schema):
    field_name = fields.Str(required=True, validate=validate.Length(min=1))
    field_type = fields.Str(required=True, validate=validate_field_type)
    required = fields.Boolean(required=True)
    options = fields.List(fields.Str(), required=False)  # only for selection
