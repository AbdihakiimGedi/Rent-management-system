from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app.extensions import db, mail
from app.models.booking import Booking
from app.models.user import User
from app.models.RentalItem import RentalItem
from flask_mail import Message
from app.utils.security import jwt_required
from app.utils.security import admin_required

payment_bp = Blueprint("payment", __name__, url_prefix="/payment")

# ------------------- Helper Functions -------------------
def send_email(to, subject, body):
    msg = Message(subject, recipients=[to], html=body)
    mail.send(msg)

def validate_payment_method(method, account):
    if method == "EVC_PLUS":
        if not account.isdigit() or len(account) not in [9,10]:
            return False, "EVC+ number must be 9-10 digits"
    elif method == "BANK":
        if not account.isdigit() or len(account) < 10:
            return False, "Bank account number invalid"
    else:
        return False, "Unsupported payment method"
    return True, ""

# ------------------- Submit Payment -------------------
@payment_bp.route("/submit", methods=["POST"])
@jwt_required
def submit_payment():
    """Submit payment for a booking"""
    try:
        data = request.get_json()
        booking_id = data.get("booking_id")
        payment_method = data.get("payment_method")
        payment_account = data.get("payment_account")
        
        if not all([booking_id, payment_method, payment_account]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Validate payment method
        is_valid, message = validate_payment_method(payment_method, payment_account)
        if not is_valid:
            return jsonify({"error": message}), 400
        
        # Get booking
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Check if user owns this booking
        if booking.renter_id != request.current_user.id:
            return jsonify({"error": "Access denied"}), 403
        
        # Update booking with payment info
        booking.payment_method = payment_method
        booking.payment_account = payment_account
        booking.payment_status = "PENDING"
        
        db.session.commit()
        
        return jsonify({
            "message": "Payment submitted successfully",
            "payment_status": "PENDING"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error submitting payment: {str(e)}"}), 500

# ------------------- View Payment Status -------------------
@payment_bp.route("/<int:booking_id>", methods=["GET"])
@jwt_required
def view_payment_status(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if request.current_user.id not in [booking.renter_id, booking.owner_id] and request.current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    # Get rental item for owner information
    rental_item = RentalItem.query.get(booking.rental_item_id)
    owner = User.query.get(rental_item.owner_id) if rental_item else None

    payment_info = {
        "booking_id": booking.id,
        "payment_status": getattr(booking, 'payment_status', 'PENDING'),
        "payment_amount": float(getattr(booking, 'payment_amount', 0)),
        "service_fee": float(getattr(booking, 'service_fee', 0)),
        "payment_method": getattr(booking, 'payment_method', 'Not specified'),
        "payment_account": getattr(booking, 'payment_account', 'Not specified'),
        "total_amount": float(getattr(booking, 'payment_amount', 0)) + float(getattr(booking, 'service_fee', 0)),
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "payment_held_at": getattr(booking, 'payment_held_at', None),
        "payment_released_at": getattr(booking, 'payment_released_at', None),
        "admin_approved": getattr(booking, 'admin_approved', None),
        "admin_approved_at": getattr(booking, 'admin_approved_at', None),
        "admin_rejection_reason": getattr(booking, 'admin_rejection_reason', None),
        "renter": {
            "id": booking.renter.id,
            "username": booking.renter.username,
            "email": booking.renter.email
        },
        "owner": {
            "id": owner.id if owner else None,
            "username": owner.username if owner else None,
            "email": owner.email if owner else None
        } if owner else None
    }

    return jsonify(payment_info), 200

# ------------------- Release Payment (Admin/System) -------------------
@payment_bp.route("/release/<int:booking_id>", methods=["POST"])
@jwt_required
def release_payment(booking_id):
    if request.current_user.role != "admin":
        return jsonify({"error": "Access denied. Admin only."}), 403

    data = request.get_json()
    admin_approved = data.get("admin_approved", True)
    rejection_reason = data.get("rejection_reason", None)

    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.payment_status != "HELD":
        return jsonify({"error": "Payment is not in held status"}), 400

    # Release the payment (approve or reject)
    booking.release_payment(admin_approved, rejection_reason)

    # Update rental item availability
    rental_item = RentalItem.query.get(booking.rental_item_id)
    if rental_item:
        if admin_approved:
            # Keep item unavailable since booking is confirmed
            pass
        else:
            # Mark item as available again since booking was rejected
            rental_item.mark_as_available()

    db.session.commit()
    
    # Log revenue tracking for approved payments
    if admin_approved:
        print(f"[REVENUE] ✅ Payment APPROVED for booking #{booking.id}")
        print(f"[REVENUE] 💰 Payment to owner: ${booking.payment_amount}")
        print(f"[REVENUE] 🏦 Service fee to admin: ${booking.service_fee}")
        print(f"[REVENUE] 📊 Admin revenue generated: ${booking.service_fee}")
        print(f"[REVENUE] 📈 Total money processed: ${float(booking.payment_amount) + float(booking.service_fee)}")
        print(f"[REVENUE] ✅ Status: {booking.status}, Payment: {booking.payment_status}")
    else:
        print(f"[REVENUE] ❌ Payment REJECTED for booking #{booking.id}")
        print(f"[REVENUE] 💸 No admin revenue generated - payment refunded")
        print(f"[REVENUE] 🔄 Service fee refunded: ${booking.service_fee}")

    # Send notifications
    try:
        from app.models.notifications import Notification
        
        if admin_approved:
            # Notification for renter
            renter_notification = Notification(
                user_id=booking.renter_id,
                message=f"✅ Your booking #{booking.id} has been CONFIRMED and payment released!",
                type="admin_approved"
            )
            db.session.add(renter_notification)
            
            # Notification for owner
            if rental_item:
                owner_notification = Notification(
                    user_id=rental_item.owner_id,
                    message=f"💰 Payment for booking #{booking.id} has been released to your account!",
                    type="payment_released"
                )
                db.session.add(owner_notification)
        else:
            # Notification for renter about rejection
            renter_notification = Notification(
                user_id=booking.renter_id,
                message=f"❌ Your booking #{booking.id} has been REJECTED by admin. Reason: {rejection_reason}",
                type="admin_rejected"
            )
            db.session.add(renter_notification)
            
            # Notification for owner about rejection
            if rental_item:
                owner_notification = Notification(
                    user_id=rental_item.owner_id,
                    message=f"❌ Booking #{booking.id} has been rejected by admin. Payment will be refunded.",
                    type="admin_rejected"
                )
                db.session.add(owner_notification)
                
    except Exception as e:
        print(f"Notification creation failed: {e}")

    return jsonify({
        "message": f"Payment {'released' if admin_approved else 'rejected'} successfully",
        "booking": booking.generate_receipt()
    }), 200

# ------------------- AUTO PAYMENT RELEASE AFTER CONFIRMATION -------------------

def auto_release_payment_after_confirmation(booking_id):
    """Automatically release payment to owner after both parties confirm delivery"""
    try:
        from app.models.booking import Booking
        from app.extensions import db
        
        print(f"[AUTO_RELEASE] 🔍 Starting auto-release for booking {booking_id}")
        
        booking = Booking.query.get(booking_id)
        if not booking:
            print(f"[AUTO_RELEASE] ❌ Booking {booking_id} not found")
            return False
        
        print(f"[AUTO_RELEASE] 📋 Booking found: status={booking.status}, payment_status={booking.payment_status}")
        print(f"[AUTO_RELEASE] 📋 Confirmation: renter={booking.renter_confirmed}, owner={booking.owner_confirmed}")
        
        # Check if payment should be auto-released
        if not booking.should_auto_release_payment():
            print(f"[AUTO_RELEASE] ⚠️ Booking {booking_id} not ready for auto-release")
            print(f"[AUTO_RELEASE] ⚠️ should_auto_release_payment() returned: {booking.should_auto_release_payment()}")
            return False
        
        # Release payment to owner
        booking.payment_status = "COMPLETED"
        booking.status = "Delivered"
        booking.payment_released_at = datetime.utcnow()
        
        # Calculate owner's payment (total minus service fee)
        owner_payment = float(booking.payment_amount)
        service_fee = float(booking.service_fee)
        
        print(f"[AUTO_RELEASE] ✅ Payment auto-released for booking #{booking_id}")
        print(f"[AUTO_RELEASE] 💰 Owner receives: ${owner_payment}")
        print(f"[AUTO_RELEASE] 🏦 Service fee: ${service_fee}")
        print(f"[AUTO_RELEASE] 📊 Total processed: ${owner_payment + service_fee}")
        
        db.session.commit()
        print(f"[AUTO_RELEASE] 💾 Database committed successfully")
        return True
        
    except Exception as e:
        print(f"[AUTO_RELEASE] ❌ Error auto-releasing payment: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return False

# ------------------- ADMIN MANUAL PAYMENT HANDLING -------------------

@payment_bp.route("/<int:booking_id>/manual-release", methods=["POST"])
@jwt_required
@admin_required
def manual_payment_release(booking_id):
    """Admin manually releases payment for partial confirmations"""
    try:
        data = request.get_json()
        action = data.get("action")  # "release" or "refund"
        reason = data.get("reason", "Manual admin action")
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found."}), 404
        
        if action == "release":
            # Release payment to owner (partial confirmation case)
            booking.payment_status = "COMPLETED"
            booking.status = "Delivered"
            booking.payment_released_at = datetime.utcnow()
            booking.admin_approved = True
            booking.admin_approved_at = datetime.utcnow()
            
            message = "Payment manually released to owner by admin"
            
        elif action == "refund":
            # Refund user (owner rejection case)
            booking.payment_status = "FAILED"
            booking.status = "Refunded"
            booking.payment_released_at = datetime.utcnow()
            booking.admin_approved = False
            booking.admin_rejection_reason = reason
            
            message = "Payment refunded to user by admin"
            
        else:
            return jsonify({"error": "Invalid action. Use 'release' or 'refund'."}), 400
        
        db.session.commit()
        
        return jsonify({
            "message": message,
            "booking_id": booking_id,
            "action": action,
            "payment_status": booking.payment_status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error processing manual payment: {str(e)}"}), 500

# ------------------- Get User Payments -------------------
@payment_bp.route("/my-payments", methods=["GET"])
@jwt_required
def get_user_payments():
    """Get all payments for the current user with search and filter capabilities"""
    try:
        # Get search and filter parameters from request
        search_term = request.args.get('search', '').strip()
        status_filter = request.args.get('status', '').strip()
        method_filter = request.args.get('method', '').strip()
        date_filter = request.args.get('date', '').strip()
        
        if request.current_user.role == "user":
            # Get payments for bookings made by user
            payments = db.session.query(Booking, RentalItem).join(
                RentalItem, Booking.rental_item_id == RentalItem.id
            ).filter(Booking.renter_id == request.current_user.id).all()
        elif request.current_user.role == "owner":
            # Get payments for rental items owned by owner
            payments = db.session.query(Booking, RentalItem).join(
                RentalItem, Booking.rental_item_id == RentalItem.id
            ).filter(RentalItem.owner_id == request.current_user.id).all()
        else:
            return jsonify({"error": "Invalid user role"}), 400

        result = []
        for booking, rental_item in payments:
            try:
                # Get category information
                category_name = "Unknown"
                if hasattr(rental_item, 'category') and rental_item.category:
                    category_name = rental_item.category.name
                else:
                    pass
                
                # Get meaningful item name from dynamic data
                item_name = "Unknown Item"
                item_data = {}
                
                # First try to get category name for better item identification
                if rental_item and hasattr(rental_item, 'category') and rental_item.category:
                    category_name = rental_item.category.name
                    # Use category name as base for item name
                    item_name = f"{category_name} Item"
                else:
                    pass
                
                # Then try to extract from dynamic data if available
                if rental_item and hasattr(rental_item, 'dynamic_data') and rental_item.dynamic_data:
                    try:
                        import json
                        if isinstance(rental_item.dynamic_data, str):
                            item_data = json.loads(rental_item.dynamic_data)
                        else:
                            item_data = rental_item.dynamic_data
                        
                        # Try to construct a meaningful name from the actual stored data
                        if item_data:
                            # Look for brand/model combinations (common in car rentals)
                            brand = item_data.get('Brand', '')
                            model = item_data.get('Model', '')
                            
                            if brand and model:
                                item_name = f"{brand} {model}"
                            elif brand:
                                item_name = f"{brand} {category_name}"
                            elif model:
                                item_name = f"{model} {category_name}"
                            else:
                                pass
                            
                            # Look for property details (common in house rentals)
                            bedrooms = item_data.get('Bedrooms', '')
                            property_type = item_data.get('Property Type', '')
                            
                            if bedrooms and property_type:
                                item_name = f"{bedrooms} Bedroom {property_type}"
                            elif property_type:
                                item_name = f"{property_type} {category_name}"
                            else:
                                pass
                            
                            # Look for device details (common in electronics)
                            device_type = item_data.get('Device Type', '')
                            device_brand = item_data.get('Brand', '')
                            
                            if device_type and device_brand:
                                item_name = f"{device_brand} {device_type}"
                            elif device_type:
                                item_name = f"{device_type} {category_name}"
                            else:
                                pass
                            
                            # If still no good name, try to use any descriptive field
                            if item_name == f"{category_name} Item":
                                for field_name, field_value in item_data.items():
                                    if field_value and str(field_value).strip() and field_name not in ['Brand', 'Model', 'Bedrooms', 'Property Type', 'Device Type']:
                                        item_name = f"{category_name} - {str(field_value)[:30]}"
                                        break
                            else:
                                pass
                            
                            # Final fallback: use category + ID
                            if item_name == f"{category_name} Item":
                                item_name = f"{category_name} #{rental_item.id}"
                            else:
                                pass
                    except Exception as e:
                        print(f"Error parsing dynamic data for payment item {rental_item.id}: {str(e)}")
                        item_data = {}
                else:
                    pass
                
                # Final fallback if no name was found
                if item_name == "Unknown Item":
                    item_name = f"Rental Item #{rental_item.id}"
                
                payment_info = {
                    "booking_id": booking.id,
                    "rental_item_name": item_name,
                    "payment_status": getattr(booking, 'payment_status', 'PENDING'),
                    "payment_amount": float(getattr(booking, 'payment_amount', 0)),
                    "service_fee": float(getattr(booking, 'service_fee', 0)),
                    "total_amount": float(getattr(booking, 'payment_amount', 0)) + float(getattr(booking, 'service_fee', 0)),
                    "payment_method": getattr(booking, 'payment_method', 'Not specified'),
                    "payment_account": getattr(booking, 'payment_account', 'Not specified'),
                    "created_at": booking.created_at.isoformat() if booking.created_at else None,
                    "payment_held_at": getattr(booking, 'payment_held_at', None),
                    "payment_released_at": getattr(booking, 'payment_released_at', None),
                    "status": booking.status,
                    "admin_approved": getattr(booking, 'admin_approved', None)
                }
                
                if request.current_user.role == "user":
                    payment_info["owner"] = {
                        "username": User.query.get(rental_item.owner_id).username if rental_item.owner_id else "Unknown"
                    }
                else:
                    payment_info["renter"] = {
                        "username": booking.renter.username if booking.renter else "Unknown"
                    }
                
                # Apply filters before adding to result
                should_include = True
                
                # Status filter
                if status_filter and payment_info["payment_status"] != status_filter:
                    should_include = False
                
                # Method filter
                if method_filter and payment_info["payment_method"] != method_filter:
                    should_include = False
                
                # Date filter (check if created_at falls within the specified date)
                if date_filter and payment_info["created_at"]:
                    try:
                        from datetime import datetime
                        filter_date = datetime.fromisoformat(date_filter.replace('Z', '+00:00'))
                        payment_date = datetime.fromisoformat(payment_info["created_at"].replace('Z', '+00:00'))
                        
                        # Check if payment date is on the same day as filter date
                        if payment_date.date() != filter_date.date():
                            should_include = False
                    except Exception as e:
                        print(f"Error parsing date filter: {e}")
                
                # Search filter (check multiple fields)
                if search_term and should_include:
                    search_lower = search_term.lower()
                    searchable_fields = [
                        str(payment_info["booking_id"]),
                        payment_info["rental_item_name"],
                        payment_info["payment_status"],
                        str(payment_info["payment_amount"]),
                        str(payment_info["service_fee"]),
                        str(payment_info["total_amount"]),
                        payment_info["payment_method"],
                        payment_info["payment_account"]
                    ]
                    
                    # Check if any field contains the search term
                    field_matches = []
                    for i, field in enumerate(searchable_fields):
                        if search_lower in field.lower():
                            field_matches.append(f"Field {i}: '{field}'")
                    
                    # Also check if search term is a number and matches amounts or IDs exactly
                    if search_term.isdigit():
                        search_number = int(search_term)
                        if search_number == payment_info["booking_id"]:
                            field_matches.append(f"Exact ID match: {search_number}")
                        if search_number == int(payment_info["payment_amount"]):
                            field_matches.append(f"Exact amount match: {search_number}")
                        if search_number == int(payment_info["service_fee"]):
                            field_matches.append(f"Exact service fee match: {search_number}")
                        if search_number == int(payment_info["total_amount"]):
                            field_matches.append(f"Exact total match: {search_number}")
                    
                    if not field_matches:
                        should_include = False
                
                if should_include:
                    result.append(payment_info)
                    
            except Exception as e:
                print(f"Error processing payment for booking {booking.id}: {e}")
                continue

        return jsonify({"payments": result}), 200
        
    except Exception as e:
        print(f"Error fetching user payments: {e}")
        return jsonify({"error": "Could not fetch payments"}), 500
