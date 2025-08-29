from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.booking import Booking
from app.models.RentalItem import RentalItem
from app.models.RentalInputField import RenterInputField
from app.schemas.booking_schema import InitialBookingSchema, BookingSchema
from app.utils.security import jwt_required
import json
from datetime import datetime

booking_bp = Blueprint("booking", __name__, url_prefix="/api/booking")

# ------------------- Get Renter Input Fields for Item (User) -------------------
@booking_bp.route("/rental-items/<int:item_id>/renter-fields", methods=["GET"]) 
@jwt_required
def get_renter_fields_for_item(item_id):
    """Return owner-defined renter input fields for a rental item (accessible to users)."""
    try:
        rental_item = RentalItem.query.get(item_id)
        if not rental_item:
            return jsonify({"error": "Rental item not found."}), 404

        fields = RenterInputField.query.filter_by(rental_item_id=item_id).order_by(RenterInputField.id.asc()).all()
        return jsonify({
            "renter_input_fields": [f.to_dict() for f in fields],
            "count": len(fields)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch renter fields: {str(e)}"}), 500

# ------------------- Submit Initial Booking (Requirements Only) -------------------
@booking_bp.route("/rental-items/<int:item_id>/requirements", methods=["POST"])
@jwt_required
def submit_booking_requirements(item_id):
    """Submit booking requirements only - creates temporary booking record"""
    print(f"[DEBUG] submit_booking_requirements - User: {request.current_user}")
    print(f"[DEBUG] submit_booking_requirements - User role: {request.current_user.role}")
    print(f"[DEBUG] submit_booking_requirements - User ID: {request.current_user.id}")
    print(f"[DEBUG] submit_booking_requirements - Item ID: {item_id}")
    
    if request.current_user.role != "user":
        print(f"[DEBUG] submit_booking_requirements - Role check failed: {request.current_user.role} != 'user'")
        return jsonify({"error": "Only users can submit bookings."}), 403

    rental_item = RentalItem.query.get(item_id)
    if not rental_item:
        print(f"[DEBUG] submit_booking_requirements - Rental item {item_id} not found")
        return jsonify({"error": "Rental item not found."}), 404
    
    print(f"[DEBUG] submit_booking_requirements - Rental item found: {rental_item}")
    print(f"[DEBUG] submit_booking_requirements - Rental item owner_id: {rental_item.owner_id}")
    print(f"[DEBUG] submit_booking_requirements - Rental item category_id: {rental_item.category_id}")
    print(f"[DEBUG] submit_booking_requirements - Rental item is_available: {rental_item.is_available}")

    # Check if item is available
    print(f"[DEBUG] submit_booking_requirements - Checking availability for item {item_id}")
    try:
        is_available = rental_item.check_availability()
        print(f"[DEBUG] submit_booking_requirements - Item availability: {is_available}")
    except Exception as e:
        print(f"[DEBUG] submit_booking_requirements - Error checking availability: {e}")
        return jsonify({"error": f"Error checking item availability: {str(e)}"}), 500
    
    if not is_available:
        print(f"[DEBUG] submit_booking_requirements - Item {item_id} is not available")
        return jsonify({"error": "This item is no longer available for rental."}), 400

    # Check if user already has an active booking for this item
    existing_booking = Booking.query.filter_by(
        rental_item_id=item_id,
        renter_id=request.current_user.id
    ).filter(
        Booking.payment_status.in_(["HELD", "COMPLETED"])
    ).first()
    
    if existing_booking:
        return jsonify({"error": "You already have an active booking for this item."}), 400
    
    # Check if user has a PENDING booking (requirements submitted but payment not completed)
    pending_booking = Booking.query.filter_by(
        rental_item_id=item_id,
        renter_id=request.current_user.id,
        payment_status="PENDING",
        status="Requirements_Submitted"
    ).first()
    
    if pending_booking:
        print(f"[DEBUG] submit_booking_requirements - Found existing PENDING booking: {pending_booking.id}")
        # Return the existing booking info so user can continue to payment
        return jsonify({
            "message": "You have existing requirements for this item. Please complete payment to finalize your booking.",
            "booking_id": pending_booking.id,
            "payment_amount": pending_booking.payment_amount,
            "next_step": "payment",
            "warning": "⚠️ IMPORTANT: Your booking is NOT complete until payment is submitted. Complete payment to activate your rental.",
            "info": "💡 You can now proceed to payment to complete your booking.",
            "existing_booking": True
        }), 200

    data = request.get_json()
    schema = InitialBookingSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    if not data.get("contract_accepted"):
        return jsonify({"error": "You must accept the contract to submit a booking."}), 400

    # Validate all dynamic renter fields
    renter_fields = RenterInputField.query.filter_by(rental_item_id=item_id).all()
    missing_fields = []
    for f in renter_fields:
        if f.field_name not in data["requirements_data"] or data["requirements_data"][f.field_name] in [None, "", []]:
            missing_fields.append(f.field_name)
    if missing_fields:
        return jsonify({"error": "Missing required fields", "fields": missing_fields}), 400

    # Strong validation: Ensure payment amount is calculated and valid
    if "total_price" not in data["requirements_data"] or not data["requirements_data"]["total_price"]:
        return jsonify({"error": "Payment amount could not be calculated. Please check your rental period and dates."}), 400
    
    payment_amount = float(data["requirements_data"]["total_price"])
    if payment_amount <= 0:
        return jsonify({"error": "Invalid payment amount. Please check your rental period and dates."}), 400

    # Create temporary booking record (requirements only, no payment details)
    booking = Booking(
        rental_item_id=item_id,
        renter_id=request.current_user.id,
        contract_accepted=data.get("contract_accepted", False),
        payment_amount=payment_amount,
        payment_status="PENDING",  # Payment not submitted yet
        payment_method="",  # Will be filled during payment
        payment_account="",  # Will be filled during payment
        service_fee=0.00,  # Will be calculated during payment
        status="Requirements_Submitted"  # New status for requirements-only bookings
    )
    booking.set_requirements_data(data["requirements_data"])

    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "message": "Requirements submitted successfully! Please complete payment to finalize your booking.",
        "booking_id": booking.id,
        "payment_amount": payment_amount,
        "next_step": "payment",
        "warning": "⚠️ IMPORTANT: Your booking is NOT complete until payment is submitted. Complete payment to activate your rental.",
        "info": "💡 You can now proceed to payment to complete your booking."
    }), 201

# ------------------- Submit Payment and Complete Booking -------------------
@booking_bp.route("/<int:booking_id>/complete-payment", methods=["POST"])
@jwt_required
def complete_booking_payment(booking_id):
    """Complete the booking by submitting payment details"""
    if request.current_user.role != "user":
        return jsonify({"error": "Only users can complete bookings."}), 403

    data = request.get_json()
    payment_method = data.get("payment_method")
    payment_account = data.get("payment_account")

    if not all([payment_method, payment_account]):
        return jsonify({"error": "Missing payment information."}), 400

    # Get booking and verify ownership
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    if booking.renter_id != request.current_user.id:
        return jsonify({"error": "Access denied."}), 403

    if booking.payment_status != "PENDING":
        return jsonify({"error": "Payment already submitted for this booking."}), 400

    # Calculate service fee (5% of total amount)
    service_fee = float(booking.payment_amount) * 0.05

    # Update booking with payment details and hold payment
    booking.payment_method = payment_method
    booking.payment_account = payment_account
    booking.service_fee = service_fee
    booking.hold_payment()  # This sets status to "Payment_Held"

    # Mark rental item as unavailable
    rental_item = RentalItem.query.get(booking.rental_item_id)
    if rental_item:
        rental_item.mark_as_unavailable()
        
        # Create notification for owner about new booking
        from app.models.notifications import Notification
        from app.models.user import User
        
        owner = User.query.get(rental_item.owner_id)
        if owner:
            owner_notification = Notification(
                user_id=rental_item.owner_id,
                message=f"New booking received for {rental_item.get_dynamic_data().get('Item Name', 'your rental item')}! Check your dashboard to accept or reject.",
                type="new_booking"
            )
            db.session.add(owner_notification)

    db.session.commit()

    return jsonify({
        "message": "Payment submitted successfully! Your payment is now held until owner acceptance.",
        "payment_status": "HELD",
        "service_fee": service_fee,
        "total_amount": float(booking.payment_amount) + service_fee,
        "next_step": "owner_acceptance"
    }), 200

# ------------------- User Confirm Delivery -------------------
@booking_bp.route("/<int:booking_id>/confirm-delivery", methods=["POST"])
@jwt_required
def confirm_delivery(booking_id):
    """User confirms delivery with confirmation code"""
    if request.current_user.role != "user":
        return jsonify({"error": "Only users can confirm delivery."}), 403
    
    data = request.get_json()
    print(f"[CONFIRM_DELIVERY] 🔍 Request data: {data}")
    confirmation_code = data.get("confirmation_code")
    print(f"[CONFIRM_DELIVERY] 🔍 Confirmation code received: {confirmation_code}")
    
    if not confirmation_code:
        return jsonify({"error": "Confirmation code is required."}), 400
    
    # Get booking and verify ownership
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404
    
    if booking.renter_id != request.current_user.id:
        return jsonify({"error": "Access denied."}), 403
    
    # Check if booking is in correct state
    print(f"[CONFIRM_DELIVERY] 🔍 Checking booking state for booking {booking_id}")
    print(f"[CONFIRM_DELIVERY] 🔍 owner_confirmation_status: {booking.owner_confirmation_status}")
    print(f"[CONFIRM_DELIVERY] 🔍 status: {booking.status}")
    print(f"[CONFIRM_DELIVERY] 🔍 renter_id: {booking.renter_id}")
    print(f"[CONFIRM_DELIVERY] 🔍 current_user_id: {request.current_user.id}")
    
    # Check if owner has accepted the booking (check both possible field names)
    owner_accepted = (
        booking.owner_confirmation_status == "ACCEPTED" or 
        booking.status == "Owner_Accepted"
    )
    
    if not owner_accepted:
        return jsonify({"error": "Owner must accept the booking before you can confirm delivery."}), 400
    
    if booking.renter_confirmed:
        return jsonify({"error": "Delivery already confirmed by you."}), 400
    
    # Confirm delivery
    print(f"[CONFIRM_DELIVERY] 🔍 Calling user_confirm_delivery with code: {confirmation_code}")
    success, message = booking.user_confirm_delivery(confirmation_code)
    print(f"[CONFIRM_DELIVERY] 🔍 user_confirm_delivery result: success={success}, message={message}")
    
    if not success:
        return jsonify({"error": message}), 400
    
    # Update booking status to show user has confirmed
    if success:
        # Don't change the main status here - keep it as "Owner_Accepted" 
        # The renter_confirmed field will indicate user confirmation
        print(f"[CONFIRM_DELIVERY] ✅ User confirmation recorded, status remains: {booking.status}")
    
    # Check if delivery is complete and payment should be released
    if booking.is_delivery_complete():
        # Both parties confirmed - auto-release payment
        from app.routes.payment_routes import auto_release_payment_after_confirmation
        auto_release_payment_after_confirmation(booking.id)
        
        # Update final status
        booking.status = "Completed"
        print(f"[CONFIRM_DELIVERY] ✅ Updated booking status to: {booking.status}")
        
        # Send completion notifications
        from app.models.notifications import Notification
        
        # Notification for user about completion
        user_completion_notification = Notification(
            user_id=request.current_user.id,
            message=f"🎉 Rental delivery has been COMPLETED!",
            type="delivery_completed"
        )
        db.session.add(user_completion_notification)
        
        # Detailed completion notification for user
        user_detail_notification = Notification(
            user_id=request.current_user.id,
            message=f"💰 Your payment has been released to the owner. Both parties confirmed successfully!",
            type="payment_released"
        )
        db.session.add(user_detail_notification)
        
        message = "Delivery confirmed! Both parties confirmed - payment automatically released."
    else:
        message = "Delivery confirmed! Waiting for owner confirmation to complete delivery."
    
    db.session.commit()
    
    return jsonify({
        "success": True,  # Add success field for frontend compatibility
        "message": message,
        "delivery_status": "confirmed",
        "both_confirmed": booking.is_delivery_complete(),
        "payment_status": booking.payment_status,
        "renter_confirmed": booking.renter_confirmed,
        "owner_confirmed": booking.owner_confirmed,
        "status": booking.status
    }), 200

# ------------------- USER NOTIFICATIONS -------------------
@booking_bp.route("/notifications", methods=["GET"])
@jwt_required
def get_user_notifications():
    """Get user notifications with detailed booking information"""
    try:
        # Get notifications for the current user
        from app.models.notifications import Notification
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.user import User
        
        # Get all notifications for this user
        notifications = Notification.query.filter_by(
            user_id=request.current_user.id
        ).order_by(Notification.created_at.desc()).limit(20).all()
        
        notifications_data = []
        
        for notification in notifications:
            notification_info = {
                "id": notification.id,
                "message": notification.message,
                "type": notification.type,
                "is_read": notification.read,
                "created_at": notification.created_at.isoformat() if notification.created_at else None,
            }
            notifications_data.append(notification_info)
        
        return jsonify({
            "notifications": notifications_data,
            "total_count": len(notifications_data)
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error fetching user notifications: {str(e)}")
        return jsonify({"error": f"Error fetching notifications: {str(e)}"}), 500

@booking_bp.route("/notifications/<int:notification_id>/mark-read", methods=["PUT"])
@jwt_required
def mark_user_notification_read(notification_id):
    """Mark a user notification as read"""
    try:
        from app.models.notifications import Notification
        
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=request.current_user.id
        ).first()
        
        if not notification:
            return jsonify({"error": "Notification not found."}), 404
        
        notification.read = True
        db.session.commit()
        
        return jsonify({"message": "Notification marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error marking notification as read: {str(e)}"}), 500

# ------------------- View Own Bookings -------------------
@booking_bp.route("/my-bookings", methods=["GET"])
@jwt_required
def view_own_bookings():
    print(f"[DEBUG] view_own_bookings - User: {request.current_user}")
    print(f"[DEBUG] view_own_bookings - User role: {request.current_user.role}")
    print(f"[DEBUG] view_own_bookings - User ID: {request.current_user.id}")
    
    # Get search and filter parameters
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()
    date_filter = request.args.get('date', '').strip()
    
    print(f"[DEBUG] Search params - search: '{search}', status: '{status_filter}', date: '{date_filter}'")
    
    # Check if user exists in database
    from app.models.user import User
    db_user = User.query.get(request.current_user.id)
    if db_user:
        print(f"[DEBUG] view_own_bookings - DB User: {db_user.username}, Role: {db_user.role}")
    else:
        print(f"[DEBUG] view_own_bookings - User not found in database!")
        return jsonify({"error": "User not found in database"}), 404
    
    if request.current_user.role != "user":
        print(f"[DEBUG] view_own_bookings - Role check failed: {request.current_user.role} != 'user'")
        return jsonify({"error": "Only users can view their bookings."}), 403

    try:
        print(f"[DEBUG] view_own_bookings - Using simple approach to get all bookings...")
        
        # Import required models
        from app.models.RentalItem import RentalItem
        from app.models.category import Category
        
        # Start with base query
        query = Booking.query.filter_by(renter_id=request.current_user.id)
        
        # Apply status filter if provided
        if status_filter:
            print(f"[DEBUG] Applying status filter: {status_filter}")
            query = query.filter(Booking.status == status_filter)
        
        # Apply date filter if provided
        if date_filter:
            print(f"[DEBUG] Applying date filter: {date_filter}")
            try:
                filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                # We'll apply date filtering after we extract the dates from requirements_data
                # For now, just mark that we need to filter by date
                print(f"[DEBUG] Date filter will be applied after data extraction: {filter_date}")
            except ValueError as e:
                print(f"[DEBUG] Invalid date format: {date_filter}, error: {e}")
                # Continue without date filter if invalid
        
        # Get filtered bookings
        all_bookings = query.order_by(Booking.created_at.asc()).all()
        print(f"[DEBUG] Found {len(all_bookings)} bookings after filtering")
        
        result = []
        for booking in all_bookings:
            print(f"[DEBUG] Processing booking {booking.id}")
            
            # Try to get related data, but don't fail if missing
            rental_item = None
            category = None
            owner_user = None
            
            try:
                rental_item = RentalItem.query.get(booking.rental_item_id)
                if rental_item:
                    category = Category.query.get(rental_item.category_id) if rental_item.category_id else None
                    owner_user = User.query.get(rental_item.owner_id) if rental_item.owner_id else None
            except Exception as e:
                print(f"[DEBUG] Error getting related data for booking {booking.id}: {e}")
                # Continue with basic data
            
            print(f"[DEBUG] Processing booking {booking.id} for item {rental_item.id if rental_item else 'None'}")
            print(f"[DEBUG] Rental item: {rental_item}")
            print(f"[DEBUG] Category: {category}")
            print(f"[DEBUG] Owner user: {owner_user}")
            
            # Parse the rental item's dynamic data to get pricing
            item_data = {}
            if rental_item and rental_item.dynamic_data:
                try:
                    import json
                    item_data = json.loads(rental_item.dynamic_data)
                    print(f"[DEBUG] Item dynamic data: {item_data}")
                except Exception as e:
                    print(f"[DEBUG] Error parsing dynamic data: {e}")
                    item_data = {}
            
            # Get requirements data to extract rental period and dates
            requirements_data = booking.get_requirements_data()
            print(f"[DEBUG] Requirements data: {requirements_data}")
            
            # Extract rental period and dates from requirements data
            rental_period = "Unknown"
            start_date = None
            end_date = None
            
            # Look for rental period in various possible field names
            period_fields = ['rental_period', 'Perido selection', 'period', 'Period']
            for field in period_fields:
                if field in requirements_data and requirements_data[field]:
                    rental_period = str(requirements_data[field])
                    break
            
            # Look for start date in various possible field names
            start_date_fields = ['start_date', 'Start-date', 'start date', 'Start date']
            for field in start_date_fields:
                if field in requirements_data and requirements_data[field]:
                    start_date = str(requirements_data[field])
                    break
            
            # Look for end date in various possible field names
            end_date_fields = ['end_date', 'End-date', 'end date', 'End date']
            for field in end_date_fields:
                if field in requirements_data and requirements_data[field]:
                    end_date = str(requirements_data[field])
                    break
            
            # Calculate rental days
            rental_days = 0
            if start_date and end_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d')
                    end = datetime.strptime(end_date, '%Y-%m-%d')
                    rental_days = (end - start).days
                    print(f"[DEBUG] Rental days calculated: {rental_days}")
                except Exception as e:
                    print(f"[DEBUG] Error calculating rental days: {e}")
                    rental_days = 0
            
            # Apply date filter if provided (after extracting dates)
            if date_filter and (start_date or end_date):
                try:
                    filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
                    
                    # Check if the filter date falls within the rental period
                    date_matches = False
                    if start_date_obj and end_date_obj:
                        date_matches = start_date_obj <= filter_date <= end_date_obj
                    elif start_date_obj:
                        date_matches = start_date_obj == filter_date
                    elif end_date_obj:
                        date_matches = end_date_obj == filter_date
                    
                    if not date_matches:
                        print(f"[DEBUG] Booking {booking.id} filtered out by date filter: {filter_date}")
                        continue
                        
                except ValueError as e:
                    print(f"[DEBUG] Error in date filtering: {e}")
                    # Continue without date filter if there's an error
            
            # Get item rental price from dynamic data
            item_rental_price = 0
            item_name = "Unknown Item"
            
            # First try to use category name as base
            if category and category.name:
                item_name = f"{category.name} Item"
                print(f"[DEBUG] Using category-based item name: {item_name}")
            
            if item_data:
                # Look for item name - updated to match actual stored field names
                name_fields = ['Item Name', 'Car name', 'item_name', 'Name', 'name']
                for field in name_fields:
                    if field in item_data and item_data[field]:
                        item_name = str(item_data[field])
                        print(f"[DEBUG] Found item name in field '{field}': {item_name}")
                        break
                
                # If we found a specific name, combine it with category for better description
                if item_name != f"{category.name} Item" and category and category.name:
                    item_name = f"{category.name} - {item_name}"
                    print(f"[DEBUG] Combined item name: {item_name}")
                
                # Look for common price fields - updated to match actual stored field names
                price_fields = ['Price', 'Car rice', 'price', 'Daily Rate', 'daily_rate', 'Hourly Rate', 'hourly_rate', 'Cost', 'cost']
                for field in price_fields:
                    if field in item_data and item_data[field]:
                        try:
                            item_rental_price = float(item_data[field])
                            print(f"[DEBUG] Found price in field '{field}': {item_rental_price}")
                            break
                        except Exception as e:
                            print(f"[DEBUG] Error parsing price from field '{field}': {e}")
                            continue
            
            # Calculate total amount
            payment_amount = float(booking.payment_amount) if booking.payment_amount else 0
            service_fee = float(booking.service_fee) if booking.service_fee else 0
            total_amount = payment_amount + service_fee
            
            print(f"[DEBUG] Financial data - Payment: {payment_amount}, Service Fee: {service_fee}, Total: {total_amount}")
            
            booking_data = {
                "booking_id": booking.id,
                "rental_item_id": booking.rental_item_id,
                "rental_item_name": item_name,
                "category_id": category.id if category else None,
                "category_name": category.name if category else None,
                "owner_id": owner_user.id if owner_user else None,
                "owner_username": owner_user.username if owner_user else None,
                "owner_email": owner_user.email if owner_user else None,
                "renter_id": booking.renter_id,
                "requirements_data": requirements_data,
                "rental_period": rental_period,
                "start_date": start_date,
                "end_date": end_date,
                "rental_days": rental_days,
                "item_rental_price": item_rental_price,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "payment_amount": payment_amount,
                "service_fee": service_fee,
                "total_amount": total_amount,
                "payment_method": getattr(booking, 'payment_method', 'Not specified'),
                "payment_account": getattr(booking, 'payment_account', 'Not specified'),
                "created_at": booking.created_at,
                "updated_at": getattr(booking, 'updated_at', None),
                "rental_item_data": item_data,
                "payment_held_at": getattr(booking, 'payment_held_at', None),
                "payment_released_at": getattr(booking, 'payment_released_at', None),
                "admin_approved": getattr(booking, 'admin_approved', None),
                # Add missing fields for status detection
                "contract_accepted": getattr(booking, 'contract_accepted', None),
                "owner_confirmation_status": getattr(booking, 'owner_confirmation_status', None),
                "owner_confirmed_at": getattr(booking, 'owner_confirmed_at', None),
                "confirmation_code": getattr(booking, 'confirmation_code', None),
                "code_expiry": getattr(booking, 'code_expiry', None)
            }
            
            # Apply search filter if provided
            if search:
                search_lower = search.lower()
                searchable_fields = [
                    str(booking_data['rental_item_name']),
                    str(booking_data['category_name']),
                    str(booking_data['owner_username']),
                    str(booking_data['owner_email']),
                    str(booking_data['booking_id']),
                    str(booking_data['rental_item_id']),
                    str(booking_data['status']),
                    str(booking_data['payment_status']),
                    str(booking_data['payment_amount']),
                    str(booking_data['service_fee']),
                    str(booking_data['total_amount']),
                    str(booking_data['payment_method']),
                    str(booking_data['payment_account']),
                    str(booking_data['rental_days']),
                    str(booking_data['start_date']),
                    str(booking_data['end_date'])
                ]
                
                # Check if any field contains the search term
                if not any(search_lower in field.lower() for field in searchable_fields):
                    print(f"[DEBUG] Booking {booking.id} filtered out by search term: {search}")
                    continue
            
            print(f"[DEBUG] Final booking data for booking {booking.id}:")
            print(f"  - Status: {booking_data['status']}")
            print(f"  - Payment Status: {booking_data['payment_status']}")
            print(f"  - Contract Accepted: {booking_data['contract_accepted']}")
            print(f"  - Admin Approved: {booking_data['admin_approved']}")
            print(f"  - Owner Confirmation Status: {booking_data['owner_confirmation_status']}")
            print(f"  - Confirmation Code: {booking_data['confirmation_code']}")
            result.append(booking_data)
        
        print(f"[DEBUG] Returning {len(result)} complete booking records after search/filtering")
        return jsonify({"bookings": result}), 200
        
    except Exception as e:
        print(f"[ERROR] view_own_bookings - Exception: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error fetching bookings", "details": str(e)}), 500

# ------------------- Test Current Booking Status -------------------
@booking_bp.route("/test-booking-status/<int:booking_id>", methods=["GET"])
@jwt_required
def test_booking_status(booking_id):
    """Test endpoint to check current booking status for debugging"""
    try:
        print(f"[DEBUG] test_booking_status called for booking_id: {booking_id}")
        print(f"[DEBUG] Current user: {request.current_user.username} (ID: {request.current_user.id})")
        
        booking = Booking.query.get(booking_id)
        if not booking:
            print(f"[DEBUG] ❌ Booking {booking_id} not found")
            return jsonify({"error": "Booking not found"}), 404
        
        print(f"[DEBUG] ✅ Booking found: {booking}")
        
        # Get all possible status fields
        status_info = {
            "booking_id": booking.id,
            "status": booking.status,
            "payment_status": booking.payment_status,
            "contract_accepted": getattr(booking, 'contract_accepted', None),
            "admin_approved": getattr(booking, 'admin_approved', None),
            "owner_confirmation_status": getattr(booking, 'owner_confirmation_status', None),
            "owner_confirmed_at": getattr(booking, 'owner_confirmed_at', None),
            "confirmation_code": getattr(booking, 'confirmation_code', None),
            "code_expiry": getattr(booking, 'code_expiry', None),
            "renter_confirmed": getattr(booking, 'renter_confirmed', None),
            "owner_confirmed": getattr(booking, 'owner_confirmed', None),
            "created_at": booking.created_at,
            "updated_at": getattr(booking, 'updated_at', None)
        }
        
        print(f"[DEBUG] 📊 Current booking status:")
        for key, value in status_info.items():
            print(f"  - {key}: {value}")
        
        return jsonify({
            "message": "Current booking status",
            "booking_id": booking_id,
            "status_info": status_info
        }), 200
        
    except Exception as e:
        print(f"[DEBUG] ❌ Error in test_booking_status: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error checking booking status: {str(e)}"}), 500

# ------------------- Test Database Schema -------------------
@booking_bp.route("/test-schema", methods=["GET"])
def test_schema():
    """Test endpoint to check database schema"""
    try:
        from sqlalchemy import inspect
        from app.extensions import db
        
        inspector = inspect(db.engine)
        columns = inspector.get_columns('bookings')
        
        column_info = []
        for col in columns:
            column_info.append({
                'name': col['name'],
                'type': str(col['type']),
                'nullable': col['nullable'],
                'default': col['default']
            })
        
        return jsonify({
            "message": "Database schema check",
            "table": "bookings",
            "columns": column_info
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Schema check failed",
            "details": str(e)
        }), 500

# ------------------- Test Authentication -------------------
@booking_bp.route("/test-auth", methods=["GET"])
@jwt_required
def test_auth():
    """Test endpoint to check authentication"""
    return jsonify({
        "message": "Authentication successful",
        "user": {
            "id": request.current_user.id,
            "username": request.current_user.username,
            "role": request.current_user.role
        }
    }), 200

# ------------------- View Single Booking -------------------
@booking_bp.route("/<int:booking_id>", methods=["GET"])
@jwt_required
def view_single_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found."}), 404

    if request.current_user.role == "user" and booking.renter_id != request.current_user.id:
        return jsonify({"error": "Access denied."}), 403

    try:
        # Use JOIN query to get complete data like my-bookings endpoint
        from app.models.RentalItem import RentalItem
        from app.models.category import Category
        from app.models.user import User
        
        # Get rental item, category, and owner data
        rental_item = RentalItem.query.get(booking.rental_item_id)
        category = Category.query.get(rental_item.category_id) if rental_item else None
        owner_user = User.query.get(rental_item.owner_id) if rental_item else None
        
        # Parse the rental item's dynamic data
        item_data = {}
        if rental_item and rental_item.dynamic_data:
            try:
                import json
                item_data = json.loads(rental_item.dynamic_data)
            except Exception as e:
                print(f"[DEBUG] Error parsing dynamic data: {e}")
                item_data = {}
        
        # Get requirements data
        requirements_data = booking.get_requirements_data()
        
        # Extract rental period and dates from requirements data
        rental_period = "Unknown"
        start_date = None
        end_date = None
        
        # Look for rental period in various possible field names
        period_fields = ['rental_period', 'Perido selection', 'period', 'Period']
        for field in period_fields:
            if field in requirements_data and requirements_data[field]:
                rental_period = str(requirements_data[field])
                break
        
        # Look for start date in various possible field names
        start_date_fields = ['start_date', 'Start-date', 'start date', 'Start date']
        for field in start_date_fields:
            if field in requirements_data and requirements_data[field]:
                start_date = str(requirements_data[field])
                break
        
        # Look for end date in various possible field names
        end_date_fields = ['end_date', 'End-date', 'end date', 'End date']
        for field in end_date_fields:
            if field in requirements_data and requirements_data[field]:
                end_date = str(requirements_data[field])
                break
        
        # Calculate rental days
        rental_days = 0
        if start_date and end_date:
            try:
                from datetime import datetime
                start = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d')
                rental_days = (end - start).days
            except Exception as e:
                print(f"[DEBUG] Error calculating rental days: {e}")
                rental_days = 0
        
        # Get item rental price and name from dynamic data
        item_rental_price = 0
        item_name = "Unknown Item"
        
        # First try to use category name as base
        if category and category.name:
            item_name = f"{category.name} Item"
        
        if item_data:
            # Look for item name
            name_fields = ['Item Name', 'Car name', 'item_name', 'Name', 'name']
            for field in name_fields:
                if field in item_data and item_data[field]:
                    item_name = str(item_data[field])
                    break
            
            # If we found a specific name, combine it with category for better description
            if item_name != f"{category.name} Item" and category and category.name:
                item_name = f"{category.name} - {item_name}"
            
            # Look for common price fields
            price_fields = ['Price', 'Car rice', 'price', 'Daily Rate', 'daily_rate', 'Hourly Rate', 'hourly_rate', 'Cost', 'cost']
            for field in price_fields:
                if field in item_data and item_data[field]:
                    try:
                        item_rental_price = float(item_data[field])
                        break
                    except Exception as e:
                        continue
        
        # Calculate total amount
        payment_amount = float(booking.payment_amount) if booking.payment_amount else 0
        service_fee = float(booking.service_fee) if booking.service_fee else 0
        total_amount = payment_amount + service_fee
        
        return jsonify({
            "booking_id": booking.id,
            "rental_item_id": booking.rental_item_id,
            "rental_item_name": item_name,
            "category_id": category.id if category else None,
            "category_name": category.name if category else None,
            "owner_id": owner_user.id if owner_user else None,
            "owner_username": owner_user.username if owner_user else None,
            "owner_email": owner_user.email if owner_user else None,
            "renter_id": booking.renter_id,
            "requirements_data": requirements_data,
            "rental_period": rental_period,
            "start_date": start_date,
            "end_date": end_date,
            "rental_days": rental_days,
            "item_rental_price": item_rental_price,
            "status": booking.status,
            "payment_status": booking.payment_status,
            "payment_amount": payment_amount,
            "service_fee": service_fee,
            "total_amount": total_amount,
            "payment_method": getattr(booking, 'payment_method', 'Not specified'),
            "payment_account": getattr(booking, 'payment_account', 'Not specified'),
            "created_at": booking.created_at,
            "updated_at": getattr(booking, 'updated_at', None),
            "rental_item_data": item_data,
            "payment_held_at": getattr(booking, 'payment_held_at', None),
            "payment_released_at": getattr(booking, 'payment_released_at', None),
            "admin_approved": getattr(booking, 'admin_approved', None),
            "contract_accepted": getattr(booking, 'contract_accepted', None),
            "owner_confirmation_status": getattr(booking, 'owner_confirmation_status', None),
            "owner_confirmed_at": getattr(booking, 'owner_confirmed_at', None),
            "confirmation_code": getattr(booking, 'confirmation_code', None),
            "code_expiry": getattr(booking, 'code_expiry', None)
        }), 200
        
    except Exception as e:
        print(f"[DEBUG] Error in view_single_booking: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error fetching booking details: {str(e)}"}), 500
