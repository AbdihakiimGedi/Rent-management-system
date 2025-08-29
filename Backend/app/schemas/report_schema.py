from marshmallow import Schema, fields, validate

class ReportSchema(Schema):
    id = fields.Int(dump_only=True)
    report_type = fields.Str(required=True, validate=validate.OneOf(["earnings", "completed", "system_overview", "user_analytics", "booking_analytics"]))
    format = fields.Str(required=True, validate=validate.OneOf(["pdf", "csv"]))
    start_date = fields.Date()
    end_date = fields.Date()
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Int(dump_only=True)

class ReportGenerateSchema(Schema):
    report_type = fields.Str(required=True, validate=validate.OneOf(["earnings", "completed", "system_overview", "user_analytics", "booking_analytics"]))
    format = fields.Str(required=True, validate=validate.OneOf(["pdf", "csv"]))
    start_date = fields.Date()
    end_date = fields.Date()






