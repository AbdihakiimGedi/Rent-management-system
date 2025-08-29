from marshmallow import Schema, fields

class BookingInputAnswerSchema(Schema):
    id = fields.Int(dump_only=True)
    booking_id = fields.Int(required=True)
    input_field_id = fields.Int(required=True)
    value = fields.Str(required=True)
