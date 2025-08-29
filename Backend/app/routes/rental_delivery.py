from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app.extensions import db, mail
from app.models.rental_delivery import RentalDelivery
from app.models.booking import Booking
from flask_mail import Message
from datetime import datetime, timedelta
import os
import json
import secrets

rental_delivery_bp = Blueprint("rental_delivery", __name__, url_prefix="/rental-delivery")

UPLOAD_FOLDER = "uploads/delivery_proofs"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}

# ------------------- Utility -------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def send_confirmation_email(to_email, code):
    msg = Message(
        subject="Your Delivery Confirmation Code",
        recipients=[to_email],
        body=f"Your 6-digit delivery confirmation code is: {code}. It expires in 15 minutes."
    )
    mail.send(msg)

# ------------------- Renter Confirm -------------------
@rental_delivery_bp.route("/<int:booking_id>/renter-confirm", methods=["POST"])
@login_required
def renter_confirm(booking_id):
    if current_user.role != "renter":
        return jsonify({"error": "Only renters can confirm delivery."}), 403

    booking = Booking.query.get(booking_id)
    if not booking or booking.renter_id != current_user.id:
        return jsonify({"error": "Booking not found or access denied."}), 404

    delivery = booking.delivery
    if not delivery:
        # Create delivery record and send code
        delivery = RentalDelivery(booking_id=booking.id)
        delivery.generate_confirmation_code()
        db.session.add(delivery)
        db.session.commit()
        send_confirmation_email(current_user.email, delivery.confirmation_code)
        return jsonify({"message": "Confirmation code sent to your email."}), 200

    data = request.get_json()
    code = data.get("confirmation_code")
    if not code:
        return jsonify({"error": "Confirmation code is required."}), 400

    if delivery.renter_confirmed:
        return jsonify({"error": "Delivery already confirmed by renter."}), 400

    if datetime.utcnow() > delivery.code_expiry:
        return jsonify({"error": "Confirmation code expired. Request a new one."}), 400

    if code != delivery.confirmation_code:
        return jsonify({"error": "Invalid confirmation code."}), 400

    delivery.renter_confirmed = True
    db.session.commit()
    return jsonify({"message": "Delivery confirmed successfully by renter."}), 200

# ------------------- Owner Confirm -------------------
@rental_delivery_bp.route("/<int:booking_id>/owner-confirm", methods=["POST"])
@login_required
def owner_confirm(booking_id):
    if current_user.role != "owner":
        return jsonify({"error": "Only owners can confirm delivery."}), 403

    booking = Booking.query.get(booking_id)
    if not booking or booking.owner_id != current_user.id:
        return jsonify({"error": "Booking not found or access denied."}), 404

    delivery = booking.delivery
    if not delivery:
        return jsonify({"error": "Delivery record not found. Renter must initiate confirmation first."}), 404

    # Upload proof if renter has not confirmed
    files = request.files.getlist("proof_files")
    uploaded_files = []
    for f in files:
        if f and allowed_file(f.filename):
            filename = secrets.token_hex(8) + "_" + f.filename
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            f.save(filepath)
            uploaded_files.append(filename)

    if uploaded_files:
        delivery.set_owner_proof(uploaded_files)

    # Check renter confirmation
    if not delivery.renter_confirmed and not uploaded_files:
        return jsonify({"error": "Renter has not confirmed. Upload proof to confirm manually."}), 400

    delivery.owner_confirmed = True
    delivery.delivered_at = datetime.utcnow()
    db.session.commit()

    # Automatic enforcement could be scheduled with background job (Celery) for payment/rating
    return jsonify({"message": "Delivery confirmed successfully by owner."}), 200

# ------------------- View Delivery Status -------------------
@rental_delivery_bp.route("/<int:booking_id>", methods=["GET"])
@login_required
def view_delivery_status(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    delivery = booking.delivery
    if not delivery:
        return jsonify({"message": "Delivery not yet initiated."}), 200

    if current_user.role == "renter" and booking.renter_id != current_user.id:
        return jsonify({"error": "Access denied."}), 403
    if current_user.role == "owner" and booking.owner_id != current_user.id:
        return jsonify({"error": "Access denied."}), 403

    return jsonify({
        "renter_confirmed": delivery.renter_confirmed,
        "owner_confirmed": delivery.owner_confirmed,
        "owner_proof": delivery.get_owner_proof(),
        "delivered_at": delivery.delivered_at
    }), 200
