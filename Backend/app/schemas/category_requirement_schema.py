from marshmallow import Schema, fields, validate, validates_schema, ValidationError
import json

class CategoryRequirementSchema(Schema):
    id = fields.Int(dump_only=True)
    category_id = fields.Int(required=True)
    field_name = fields.Str(required=True, validate=validate.Length(min=1))  # Keep for frontend compatibility
    field_type = fields.Str(
        required=True,
        validate=validate.OneOf(["string", "number", "date", "file", "selection"])
    )
    required = fields.Boolean(required=True)  # Keep for frontend compatibility
    options = fields.List(fields.Str(), required=False)  # Keep for frontend compatibility
    placeholder = fields.Str(required=False)
    max_images = fields.Int(required=True, missing=1)  # Required with default value

    @validates_schema
    def validate_options_for_selection(self, data, **kwargs):
        if data.get("field_type") == "selection" and not data.get("options"):
            raise ValidationError("Selection fields must have options defined.")

class CategoryRequirementCreateSchema(Schema):
    field_name = fields.Str(required=True, validate=validate.Length(min=1))
    field_type = fields.Str(
        required=True,
        validate=validate.OneOf(["string", "number", "date", "file", "selection"])
    )
    required = fields.Boolean(required=True)
    options = fields.List(fields.Str(), required=False)
    placeholder = fields.Str(required=False)
    max_images = fields.Int(required=False, missing=1)  # Optional with default

class CategoryRequirementUpdateSchema(Schema):
    field_name = fields.Str(validate=validate.Length(min=1))
    field_type = fields.Str(
        validate=validate.OneOf(["string", "number", "date", "file", "selection"])
    )
    required = fields.Boolean()
    options = fields.List(fields.Str())
    placeholder = fields.Str()
    max_images = fields.Int()
