from marshmallow import Schema, fields, validate, validates_schema, ValidationError
import json

# ----------------- Owner Submission Schema -----------------
class OwnerRequestSubmitSchema(Schema):
    requirements_data = fields.Dict(
        required=True
    )

    @validates_schema
    def validate_requirements(self, data, **kwargs):
        if not data.get("requirements_data"):
            raise ValidationError("Requirements data cannot be empty.")
        # Optional: you can add more validation based on expected keys
        if not isinstance(data["requirements_data"], dict):
            raise ValidationError("Requirements data must be a JSON object.")


# ----------------- Admin Approval / Rejection Schema -----------------
class OwnerRequestAdminSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(["Approved", "Rejected"])
    )
    rejection_reason = fields.Str(
        required=False,
        validate=validate.Length(max=255)
    )

    @validates_schema
    def validate_rejection_reason(self, data, **kwargs):
        if data.get("status") == "Rejected" and not data.get("rejection_reason"):
            raise ValidationError("Rejection reason is required when status is Rejected.")
