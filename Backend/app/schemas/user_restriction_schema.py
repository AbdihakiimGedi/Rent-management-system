from marshmallow import Schema, fields

class UserRestrictionSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    restricted = fields.Bool(dump_only=True, dump_default=False)
    reason = fields.Str(required=True)
    complaints_count = fields.Int(dump_only=True, dump_default=0)
    warning_count = fields.Int(dump_only=True, dump_default=0)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserRestrictionUpdateSchema(Schema):
    reason = fields.Str(required=True)
