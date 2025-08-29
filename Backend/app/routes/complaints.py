from flask import Blueprint, request, jsonify, current_app
from app.models.complaint import Complaint
from app.models.booking import Booking
from app.models.user import User
from app.extensions import db
from app.utils.security import jwt_required
from app.utils.email import send_email
from datetime import datetime

complaint_bp = Blueprint("complaints", __name__, url_prefix="/api/complaints")

# CORS preflight handler for all complaints routes
@complaint_bp.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"message": "OK"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

# ------------------- Submit Complaint -------------------
@complaint_bp.route("/submit", methods=["POST"])
@jwt_required
def submit_complaint():
    try:
        data = request.get_json()
        booking_id = data.get("booking_id")
        complaint_type = data.get("complaint_type")
        description = data.get("description")

        if not all([booking_id, complaint_type, description]):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate booking exists
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        # Get current user from JWT context
        current_user = request.current_user

        # Check if user is involved in the booking
        # Since owner_id might not exist, we'll check if user is the renter
        if current_user.id != booking.renter_id:
            # Try to get owner_id if it exists, otherwise skip this check
            try:
                if hasattr(booking, 'owner_id') and current_user.id != booking.owner_id:
                    return jsonify({"error": "You are not part of this booking"}), 403
            except AttributeError:
                # owner_id column doesn't exist, assume user is authorized if they're the renter
                pass

        # Prevent duplicate active complaints
        existing = Complaint.query.filter_by(
            booking_id=booking_id,
            complainant_id=current_user.id,
            status="Pending"
        ).first()
        if existing:
            return jsonify({"error": "You already have a pending complaint for this booking"}), 400

        # Determine defendant - since owner_id might not exist, we'll use a different approach
        try:
            if hasattr(booking, 'owner_id'):
                defendant_id = booking.owner_id if current_user.id == booking.renter_id else booking.renter_id
            else:
                # If no owner_id, assume the complaint is against the rental item owner
                # We'll need to get this from the rental item
                if hasattr(booking, 'rental_item') and hasattr(booking.rental_item, 'owner_id'):
                    defendant_id = booking.rental_item.owner_id
                else:
                    # Fallback: use a placeholder or skip defendant assignment
                    defendant_id = None
        except AttributeError:
            defendant_id = None

        complaint = Complaint(
            booking_id=booking_id,
            complainant_id=current_user.id,
            defendant_id=defendant_id,
            complaint_type=complaint_type,
            description=description
        )
        db.session.add(complaint)
        db.session.commit()

        # Optional notifications - handle missing email gracefully
        try:
            if defendant_id:
                defendant = User.query.get(defendant_id)
                if defendant and hasattr(defendant, 'email'):
                    send_email(
                        defendant.email,
                        "New Complaint Submitted",
                        f"A complaint has been submitted against you for booking #{booking.id}."
                    )
        except Exception as e:
            print(f"Warning: Could not send complaint notification: {e}")

        return jsonify({"message": "Complaint submitted successfully"}), 201

    except Exception as e:
        print(f"Error submitting complaint: {e}")
        return jsonify({"error": "Internal server error"}), 500

# ------------------- View Own Complaints -------------------
@complaint_bp.route("/my", methods=["GET"])
@jwt_required
def view_own_complaints():
    try:
        current_user = request.current_user
        complaints = Complaint.query.filter(
            (Complaint.complainant_id == current_user.id) | (Complaint.defendant_id == current_user.id)
        ).all()

        result = []
        for c in complaints:
            result.append({
                "id": c.id,
                "booking_id": c.booking_id,
                "complainant": c.complainant.username,
                "defendant": c.defendant.username,
                "type": c.complaint_type,
                "description": c.description,
                "status": c.status,
                "admin_notes": c.admin_notes,
                "created_at": c.created_at,
                "updated_at": c.updated_at
            })

        return jsonify({"complaints": result}), 200
    except Exception as e:
        print(f"Error viewing own complaints: {e}")
        return jsonify({"error": "Internal server error"}), 500

# ------------------- Admin: List Pending Complaints -------------------
@complaint_bp.route("/admin/pending", methods=["GET"])
@jwt_required
def list_pending_complaints():
    try:
        current_user = request.current_user
        if current_user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        complaints = Complaint.query.filter_by(status="Pending").all()
        result = []
        for c in complaints:
            result.append({
                "id": c.id,
                "booking_id": c.booking_id,
                "complainant": c.complainant.username,
                "defendant": c.defendant.username,
                "type": c.complaint_type,
                "description": c.description,
                "created_at": c.created_at
            })
        return jsonify({"pending_complaints": result}), 200
    except Exception as e:
        print(f"Error listing pending complaints: {e}")
        return jsonify({"error": "Internal server error"}), 500

# ------------------- Admin: Resolve/Reject Complaint -------------------
@complaint_bp.route("/admin/<int:complaint_id>", methods=["PUT"])
@jwt_required
def update_complaint_status(complaint_id):
    try:
        current_user = request.current_user
        if current_user.role != "admin":
            return jsonify({"error": "Admin only"}), 403

        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404

        data = request.get_json()
        status = data.get("status")
        admin_notes = data.get("admin_notes", "")

        if status not in ["Resolved", "Rejected"]:
            return jsonify({"error": "Invalid status"}), 400

        complaint.status = status
        complaint.admin_notes = admin_notes
        db.session.add(complaint)

        # Restriction logic: auto-block defendant if multiple valid complaints
        if status == "Resolved":
            valid_count = Complaint.query.filter_by(defendant_id=complaint.defendant_id, status="Resolved").count()
            if valid_count >= 3:
                user = User.query.get(complaint.defendant_id)
                user.is_restricted = True  # you can add this column to User model
                db.session.add(user)
                # Notify user
                send_email(
                    user.email,
                    "Account Restricted",
                    "Your account has been temporarily restricted due to multiple resolved complaints."
                )

        db.session.commit()

        # Notify complainant & defendant
        send_email(
            complaint.complainant.email,
            "Complaint Status Updated",
            f"Your complaint #{complaint.id} has been {status}."
        )
        send_email(
            complaint.defendant.email,
            "Complaint Status Updated",
            f"A complaint against you #{complaint.id} has been {status}."
        )

        return jsonify({"message": f"Complaint {status} successfully"}), 200
    except Exception as e:
        print(f"Error updating complaint status: {e}")
        return jsonify({"error": "Internal server error"}), 500

# ------------------- Get Single Complaint -------------------
@complaint_bp.route("/<int:complaint_id>", methods=["GET"])
@jwt_required
def get_complaint(complaint_id):
    try:
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404
        
        # Check if user is involved in this complaint
        if complaint.complainant_id != request.current_user.id and complaint.defendant_id != request.current_user.id:
            return jsonify({"error": "You are not authorized to view this complaint"}), 403
        
        return jsonify({
            "complaint": {
                "id": complaint.id,
                "booking_id": complaint.booking_id,
                "complaint_type": complaint.complaint_type,
                "description": complaint.description,
                "status": complaint.status,
                "admin_notes": complaint.admin_notes,
                "created_at": complaint.created_at.isoformat(),
                "updated_at": complaint.updated_at.isoformat(),
                "complainant": {
                    "id": complaint.complainant.id,
                    "username": complaint.complainant.username,
                    "email": complaint.complainant.email
                },
                "defendant": {
                    "id": complaint.defendant.id,
                    "username": complaint.defendant.username,
                    "email": complaint.defendant.email
                },
                "booking": {
                    "id": complaint.booking.id,
                    "rental_item_name": complaint.booking.rental_item.name if complaint.booking.rental_item else "N/A",
                    "status": complaint.booking.status,
                    "total_amount": complaint.booking.total_amount
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting complaint {complaint_id}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# ------------------- Update Complaint -------------------
@complaint_bp.route("/<int:complaint_id>", methods=["PUT"])
@jwt_required
def update_complaint(complaint_id):
    try:
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404
        
        # Only complainant can update their complaint
        if complaint.complainant_id != request.current_user.id:
            return jsonify({"error": "You can only update your own complaints"}), 403
        
        # Only allow updates if complaint is still pending
        if complaint.status != "Pending":
            return jsonify({"error": "Cannot update resolved or rejected complaints"}), 400
        
        data = request.get_json()
        
        # Validate updateable fields
        if "description" in data:
            if not data["description"] or len(data["description"].strip()) < 10:
                return jsonify({"error": "Description must be at least 10 characters long"}), 400
            complaint.description = data["description"].strip()
        
        if "complaint_type" in data:
            if data["complaint_type"] not in ["Owner", "Renter", "Other"]:
                return jsonify({"error": "Invalid complaint type"}), 400
            complaint.complaint_type = data["complaint_type"]
        
        complaint.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Complaint updated successfully",
            "complaint": {
                "id": complaint.id,
                "description": complaint.description,
                "complaint_type": complaint.complaint_type,
                "status": complaint.status,
                "updated_at": complaint.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error updating complaint {complaint_id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

# ------------------- Delete Complaint -------------------
@complaint_bp.route("/<int:complaint_id>", methods=["DELETE"])
@jwt_required
def delete_complaint(complaint_id):
    try:
        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404
        
        # Only complainant can delete their complaint
        if complaint.complainant_id != request.current_user.id:
            return jsonify({"error": "You can only delete your own complaints"}), 403
        
        # Only allow deletion if complaint is still pending
        if complaint.status != "Pending":
            return jsonify({"error": "Cannot delete resolved or rejected complaints"}), 400
        
        db.session.delete(complaint)
        db.session.commit()
        
        return jsonify({"message": "Complaint deleted successfully"}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error deleting complaint {complaint_id}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500
