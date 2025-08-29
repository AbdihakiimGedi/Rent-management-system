from flask import Blueprint, request, jsonify
from app.models.user import User
from app.extensions import db
from app.schemas.user_schema import UserRegisterSchema, UserLoginSchema
from app.utils.security import generate_jwt
from flask_cors import cross_origin

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ------------------- Register -------------------
@auth_bp.route("/register", methods=["POST", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def register():
    if request.method == "OPTIONS":
        return '', 200  # Preflight request response

    data = request.get_json()
    schema = UserRegisterSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    # Use User model's set_password method
    new_user = User(
        full_name=data["full_name"],
        phone_number=data["phone_number"],
        email=data["email"],
        address=data["address"],
        birthdate=data["birthdate"],
        username=data["username"],
        role='user',
    )
    new_user.set_password(data["password"])  # hashes password internally

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


# ------------------- Login -------------------
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def login():
    try:
        if request.method == "OPTIONS":
            print("[DEBUG] OPTIONS preflight request received")
            return '', 200  # Preflight request response

        data = request.get_json()
        print(f"[DEBUG] Received login data: {data}")

        schema = UserLoginSchema()
        errors = schema.validate(data)
        if errors:
            print(f"[DEBUG] Validation errors: {errors}")
            return jsonify({"errors": errors}), 400

        user = User.query.filter_by(username=data["username"]).first()
        print(f"[DEBUG] Queried user: {user}")

        if not user:
            print("[DEBUG] User not found")
            return jsonify({"error": "Invalid credentials"}), 401

        # Use User model's check_password method
        if not user.check_password(data["password"]):
            print("[DEBUG] Password check failed")
            return jsonify({"error": "Invalid credentials"}), 401

        if hasattr(user, "is_active") and not user.is_active:
            print("[DEBUG] Account is inactive")
            return jsonify({"error": "Account is inactive"}), 403

        token = generate_jwt(user.id, user.role)
        print(f"[DEBUG] JWT generated: {token}")

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {"id": user.id, "username": user.username, "role": user.role}
        }), 200

    except Exception as e:
        print(f"[ERROR] Exception in login route: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
