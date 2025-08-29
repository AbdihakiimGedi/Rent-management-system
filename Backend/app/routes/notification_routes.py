from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.notifications import Notification

notification_bp = Blueprint("notification", __name__, url_prefix="/notifications")

# ------------------- Get All Notifications for Logged-in User -------------------
@notification_bp.route("/", methods=["GET"])
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    result = [notif.to_dict() for notif in notifications]
    return jsonify({"notifications": result}), 200

# ------------------- Get Single Notification by ID -------------------
@notification_bp.route("/<int:notif_id>", methods=["GET"])
@login_required
def get_notification(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif or notif.user_id != current_user.id:
        return jsonify({"error": "Notification not found or access denied"}), 404
    return jsonify(notif.to_dict()), 200

# ------------------- Mark Notification as Read -------------------
@notification_bp.route("/mark-read/<int:notif_id>", methods=["POST"])
@login_required
def mark_notification_read(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif or notif.user_id != current_user.id:
        return jsonify({"error": "Notification not found or access denied"}), 404

    notif.mark_as_read()
    return jsonify({"message": "Notification marked as read", "notification": notif.to_dict()}), 200

# ------------------- Create a Notification (Admin / System Use) -------------------
@notification_bp.route("/", methods=["POST"])
@login_required
def create_notification():
    # Only admin/system can create notifications for users
    if current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    user_id = data.get("user_id")
    message = data.get("message")

    if not user_id or not message:
        return jsonify({"error": "user_id and message are required"}), 400

    notif = Notification(user_id=user_id, message=message)
    db.session.add(notif)
    db.session.commit()
    return jsonify({"message": "Notification created", "notification": notif.to_dict()}), 201

# ------------------- Delete Notification -------------------
@notification_bp.route("/<int:notif_id>", methods=["DELETE"])
@login_required
def delete_notification(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({"error": "Notification not found"}), 404

    # Only the user or admin can delete
    if notif.user_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    db.session.delete(notif)
    db.session.commit()
    return jsonify({"message": "Notification deleted"}), 200
