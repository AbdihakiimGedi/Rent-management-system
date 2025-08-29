from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db, mail
from app.models.user_restriction import UserRestriction
from app.models.user import User
from app.models.notifications import Notification
from flask_mail import Message
from datetime import datetime

restriction_bp = Blueprint("restriction", __name__, url_prefix="/restrictions")

# ------------------- Helper Function: Send Email -------------------
def send_email(to, subject, body):
    try:
        msg = Message(subject, recipients=[to], html=body)
        mail.send(msg)
    except Exception as e:
        print(f"Email failed: {e}")

# ------------------- List All Restricted Users -------------------
@restriction_bp.route("/", methods=["GET"])
@login_required
def list_restricted_users():
    if current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    restrictions = UserRestriction.query.all()
    result = []
    for r in restrictions:
        result.append({
            "user_id": r.user_id,
            "username": r.user.username,
            "restricted": r.restricted,
            "blocked_until": r.blocked_until,
            "complaints_count": r.complaints_count,
            "warning_count": r.warning_count
        })
    return jsonify({"restrictions": result}), 200

# ------------------- Get Single User Restriction -------------------
@restriction_bp.route("/<int:user_id>", methods=["GET"])
@login_required
def get_user_restriction(user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    restriction = UserRestriction.query.filter_by(user_id=user_id).first()
    if not restriction:
        return jsonify({"error": "Restriction record not found"}), 404

    return jsonify({
        "user_id": restriction.user_id,
        "username": restriction.user.username,
        "restricted": restriction.restricted,
        "blocked_until": restriction.blocked_until,
        "complaints_count": restriction.complaints_count,
        "warning_count": restriction.warning_count
    }), 200

# ------------------- Admin Issues Warning -------------------
@restriction_bp.route("/<int:user_id>/warn", methods=["POST"])
@login_required
def issue_warning(user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    restriction = UserRestriction.query.filter_by(user_id=user_id).first()
    if not restriction:
        restriction = UserRestriction(user_id=user_id)
        db.session.add(restriction)

    restriction.add_warning()
    db.session.commit()

    # Create in-app notification
    notif = Notification(user_id=user.id, message=f"You received a warning. Total warnings: {restriction.warning_count}")
    db.session.add(notif)
    db.session.commit()

    # Optional email notification
    send_email(user.email, "Warning Issued", f"You received a warning on your account. Total warnings: {restriction.warning_count}")

    return jsonify({"message": f"Warning issued to user {user.username}", "warnings": restriction.warning_count}), 200

# ------------------- Admin Unblock User -------------------
@restriction_bp.route("/<int:user_id>/unblock", methods=["POST"])
@login_required
def unblock_user(user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    restriction = UserRestriction.query.filter_by(user_id=user_id).first()
    if not restriction or not restriction.restricted:
        return jsonify({"error": "User is not restricted"}), 400

    restriction.unblock()
    db.session.commit()

    # Notification
    notif = Notification(user_id=user_id, message="Your account has been unblocked by admin.")
    db.session.add(notif)
    db.session.commit()

    send_email(restriction.user.email, "Account Unblocked", "Your account has been unblocked by the admin. Please adhere to the rules.")

    return jsonify({"message": f"User {restriction.user.username} unblocked successfully"}), 200
