from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import or_, false
from app.extensions import db
from app.models.RentalInputField import RenterInputField
from app.schemas.RentalInputFieldSchema import RenterInputFieldSchema
from marshmallow import ValidationError
import traceback

rental_input_bp = Blueprint('rental_input_bp', __name__, url_prefix='/rental-input-fields')

# ------------------- Add Rental Input Fields -------------------
@rental_input_bp.route('/', methods=['POST'])
@login_required
def add_rental_input_field():
    try:
        if current_user.role != 'owner':
            return jsonify({"error": "Only owners can add rental input fields."}), 403

        data = request.get_json()
        schema = RenterInputFieldSchema(many=True)  # <-- accept list
        validated_data_list = schema.load(data)

        responses = []

        for validated_data in validated_data_list:
            new_field = RenterInputField(**validated_data)
            db.session.add(new_field)
            db.session.commit()

            responses.append({
                "message": "Input field added successfully.",
                "field": schema.dump(new_field)
            })

        return jsonify(responses), 201

    except ValidationError as ve:
        # Catch marshmallow validation errors separately
        return jsonify({
            "error": "Validation failed.",
            "details": ve.messages
        }), 400

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            "error": "Failed to add input fields.",
            "details": str(e)
        }), 500

# ------------------- Get Input Fields by Rental Item -------------------
@rental_input_bp.route('/<int:rental_item_id>', methods=['GET'])
@login_required
def get_input_fields_by_item(rental_item_id):
    try:
        fields = RenterInputField.query.filter_by(rental_item_id=rental_item_id).all()

        if not fields:
            return jsonify({"message": "No input fields found for this rental item."}), 404

        schema = RenterInputFieldSchema(many=True)
        return jsonify({
            "fields": schema.dump(fields),
            "count": len(fields)
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            "error": "Failed to fetch input fields.",
            "details": str(e)
        }), 500
