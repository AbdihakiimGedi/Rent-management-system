from marshmallow import Schema, fields

class RentalDeliverySchema(Schema):
    id = fields.Int(dump_only=True)
    booking_id = fields.Int(required=True)
    delivery_date = fields.Date(required=True)
    delivery_time = fields.Time(required=True)
    renter_confirmed = fields.Bool(dump_only=True, dump_default=False)
    delivery_notes = fields.Str()
    owner_confirmed = fields.Bool(dump_only=True, dump_default=False)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class RentalDeliveryConfirmSchema(Schema):
    delivery_notes = fields.Str()
