from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from decimal import Decimal

class RentalItemSchema(Schema):
    """Schema for rental item creation and updates"""
    
    id = fields.Int(dump_only=True)
    owner_id = fields.Int(dump_only=True)
    category_id = fields.Int(required=True, validate=validate.Range(min=1))
    
    # Basic details
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    price = fields.Decimal(required=True, places=2, validate=validate.Range(min=Decimal('0.01')))
    currency = fields.Str(validate=validate.Length(equal=3))
    
    # Status
    is_available = fields.Boolean()
    is_featured = fields.Boolean()
    
    # Dynamic data (for category requirements)
    dynamic_data = fields.Dict()
    
    # Timestamps
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class RentalItemCreateSchema(Schema):
    """Schema for creating new rental items"""
    
    category_id = fields.Int(required=True, validate=validate.Range(min=1))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    price = fields.Decimal(required=True, places=2, validate=validate.Range(min=Decimal('0.01')))
    currency = fields.Str(missing="USD", validate=validate.Length(equal=3))
    dynamic_data = fields.Dict()

class RentalItemUpdateSchema(Schema):
    """Schema for updating rental items"""
    
    category_id = fields.Int(validate=validate.Range(min=1))
    title = fields.Str(validate=validate.Length(min=1, max=255))
    description = fields.Str(validate=validate.Length(max=2000))
    price = fields.Decimal(places=2, validate=validate.Range(min=Decimal('0.01')))
    currency = fields.Str(validate=validate.Length(equal=3))
    is_available = fields.Boolean()
    is_featured = fields.Boolean()
    dynamic_data = fields.Dict()

class RentalItemResponseSchema(Schema):
    """Schema for rental item responses"""
    
    id = fields.Int()
    owner_id = fields.Int()
    category_id = fields.Int()
    title = fields.Str()
    description = fields.Str()
    price = fields.Decimal()
    currency = fields.Str()
    main_image = fields.Str()
    additional_images = fields.List(fields.Str())
    is_available = fields.Boolean()
    is_featured = fields.Boolean()
    dynamic_data = fields.Dict()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    
    # Related data
    owner = fields.Dict()
    category = fields.Dict()
    renter_requirements_count = fields.Int()
