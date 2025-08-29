from marshmallow import Schema, fields, validate, validates_schema, ValidationError

class RenterInputFieldSchema(Schema):
    """Schema for renter input fields"""
    
    id = fields.Int(dump_only=True)
    rental_item_id = fields.Int(required=True)
    field_name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    field_type = fields.Str(required=True, validate=validate.OneOf([
        "string", "number", "date", "file", "selection", "textarea", 
        "contract", "contract_accept", "boolean", "rental_period"
    ]))
    required = fields.Boolean(default=True)
    options = fields.List(fields.Str(), allow_none=True)
    placeholder = fields.Str(allow_none=True)
    help_text = fields.Str(allow_none=True)
    order_index = fields.Int(default=0)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class RenterInputFieldCreateSchema(Schema):
    """Schema for creating new renter input fields"""
    
    rental_item_id = fields.Int(required=True)
    field_name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    field_type = fields.Str(required=True, validate=validate.OneOf([
        "string", "number", "date", "file", "selection", "textarea", 
        "contract", "contract_accept", "boolean", "rental_period"
    ]))
    required = fields.Boolean(default=True)
    options = fields.List(fields.Str(), allow_none=True)
    placeholder = fields.Str(allow_none=True)
    help_text = fields.Str(allow_none=True)
    order_index = fields.Int(default=0)

class RenterInputFieldUpdateSchema(Schema):
    """Schema for updating renter input fields"""
    
    field_name = fields.Str(validate=validate.Length(min=1, max=255))
    field_type = fields.Str(validate=validate.OneOf([
        "string", "number", "date", "file", "selection", "textarea", 
        "contract", "contract_accept", "boolean", "rental_period"
    ]))
    required = fields.Boolean()
    options = fields.List(fields.Str(), allow_none=True)
    placeholder = fields.Str(allow_none=True)
    help_text = fields.Str(allow_none=True)
    order_index = fields.Int()

class RenterInputFieldResponseSchema(Schema):
    """Schema for renter input field responses"""
    
    id = fields.Int()
    rental_item_id = fields.Int()
    field_name = fields.Str()
    field_type = fields.Str()
    required = fields.Boolean()
    options = fields.List(fields.Str())
    placeholder = fields.Str()
    help_text = fields.Str()
    order_index = fields.Int()
    created_at = fields.DateTime()

@validates_schema
def validate_options_for_selection(self, data, **kwargs):
    """Validate that selection fields have options"""
    if data.get('field_type') == 'selection' and not data.get('options'):
        raise ValidationError('Selection fields must have options defined.')





