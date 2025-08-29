from marshmallow import Schema, fields

class NotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    title = fields.Str(required=True)
    message = fields.Str(required=True)
    is_read = fields.Bool(dump_only=True, dump_default=False)
    created_at = fields.DateTime(dump_only=True)

class NotificationCreateSchema(Schema):
    user_id = fields.Int(required=True)
    title = fields.Str(required=True)
    message = fields.Str(required=True)

