from marshmallow import Schema, fields, validate, ValidationError

class UserRegisterSchema(Schema):
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    phone_number = fields.Str(required=True, validate=validate.Regexp(r"^\d{9}$", error="Phone number must be exactly 9 digits"))
    email = fields.Email(required=True)
    address = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    birthdate = fields.Date(required=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=6))

class UserLoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)

class UserUpdateSchema(Schema):
    username = fields.Str(validate=validate.Length(min=3, max=50))
    email = fields.Email()
    password = fields.Str(validate=validate.Length(min=6))
    role = fields.Str(validate=validate.OneOf(["renter", "owner", "admin"]))
    is_active = fields.Bool()
    is_restricted = fields.Bool()
