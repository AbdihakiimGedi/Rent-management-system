from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.owner_request import OwnerRequest
from app.models.owner_requirement import OwnerRequirement
from app.models.user import User
from app.models.category import Category
from app.models.category_requirement import CategoryRequirement
from app.models.booking import Booking
from app.schemas.owner_request_schema import OwnerRequestAdminSchema
from app.schemas.category_schema import CategorySchema
# Schema validation removed - using direct field mapping instead
from app.utils.security import jwt_required, admin_required
import json
from datetime import datetime, timezone

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

# ------------------- Owner Requests Routes -------------------

@admin_bp.route("/owner-requests", methods=["GET"])
@jwt_required
@admin_required
def list_pending_owner_requests():
    # Get all owner requests, not just pending ones
    owner_requests = OwnerRequest.query.all()
    result = []
    for req in owner_requests:
        result.append({
            "id": req.id,
            "user_id": req.user_id,
            "username": req.user.username,
            "email": req.user.email,
            "full_name": req.user.full_name,
            "phone_number": req.user.phone_number,
            "address": req.user.address,
            "birthdate": req.user.birthdate.isoformat() if req.user.birthdate else None,
            "status": req.status,
            "submitted_at": req.submitted_at,
            "approved_at": req.approved_at.isoformat() if req.approved_at else None,
            "rejection_reason": req.rejection_reason,
            "requirements_data": req.get_requirements_data()
        })

    return jsonify({"pending_requests": result}), 200


@admin_bp.route("/owner-requests/<int:request_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_owner_request(request_id):
    owner_request = OwnerRequest.query.get(request_id)
    if not owner_request:
        return jsonify({"error": "Owner request not found."}), 404

    data = request.get_json()
    schema = OwnerRequestAdminSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    status = data["status"]
    owner_request.status = status

    if status == "Approved":
        owner_request.approved_at = db.func.now()
        user = User.query.get(owner_request.user_id)
        user.role = "owner"
        db.session.add(user)
    elif status == "Rejected":
        owner_request.rejection_reason = data.get("rejection_reason")

    db.session.add(owner_request)
    db.session.commit()

    return jsonify({
        "message": f"Owner request {status.lower()} successfully.",
        "request": {
            "id": owner_request.id,
            "user_id": owner_request.user_id,
            "status": owner_request.status,
            "approved_at": owner_request.approved_at,
            "rejection_reason": owner_request.rejection_reason
        }
    }), 200

# ------------------- User Management Routes -------------------

@admin_bp.route("/users", methods=["GET"])
@jwt_required
@admin_required
def list_users():
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    role = request.args.get('role')
    status = request.args.get('status')
    search = request.args.get('search')

    # Build query
    query = User.query

    # Apply filters
    if role:
        query = query.filter(User.role == role)
    if status == 'active':
        query = query.filter(User.is_active == True)
    elif status == 'inactive':
        query = query.filter(User.is_active == False)
    elif status == 'restricted':
        query = query.filter(User.is_restricted == True)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term),
                User.full_name.ilike(search_term),
                User.phone_number.ilike(search_term)
            )
        )

    # Pagination
    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for user in users:
        result.append({
            "id": user.id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "address": user.address,
            "birthdate": user.birthdate.isoformat() if user.birthdate else None,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_restricted": user.is_restricted,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })

    return jsonify({
        "users": result,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    }), 200

@admin_bp.route("/users", methods=["POST"])
@jwt_required
@admin_required
def create_user():
    data = request.get_json()
    
    # Check for required fields
    required_fields = ["username", "email", "password", "full_name", "phone_number", "address", "birthdate"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field.replace('_', ' ').title()} is required"}), 400

    # Check for duplicate username/email
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    # Parse birthdate
    try:
        birthdate = datetime.strptime(data["birthdate"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid birthdate format. Use YYYY-MM-DD"}), 400

    # Create user
    user = User(
        full_name=data["full_name"],
        phone_number=data["phone_number"],
        email=data["email"],
        address=data["address"],
        birthdate=birthdate,
        username=data["username"],
        role=data.get("role", "user"),
        is_active=data.get("is_active", True),
        is_restricted=data.get("is_restricted", False),
        created_at=datetime.now()
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "address": user.address,
            "birthdate": user.birthdate.isoformat() if user.birthdate else None,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_restricted": user.is_restricted,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }), 201

@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required
@admin_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "address": user.address,
            "birthdate": user.birthdate.isoformat() if user.birthdate else None,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_restricted": user.is_restricted,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }), 200

@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    
    # Update fields
    if "full_name" in data:
        user.full_name = data["full_name"]
    
    if "phone_number" in data:
        user.phone_number = data["phone_number"]
    
    if "email" in data:
        # Check for duplicate email
        existing_user = User.query.filter_by(email=data["email"]).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({"error": "Email already exists"}), 400
        user.email = data["email"]
    
    if "address" in data:
        user.address = data["address"]
    
    if "birthdate" in data:
        try:
            birthdate = datetime.strptime(data["birthdate"], "%Y-%m-%d").date()
            user.birthdate = birthdate
        except ValueError:
            return jsonify({"error": "Invalid birthdate format. Use YYYY-MM-DD"}), 400
    
    if "username" in data:
        # Check for duplicate username
        existing_user = User.query.filter_by(username=data["username"]).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({"error": "Username already exists"}), 400
        user.username = data["username"]
    
    if "role" in data:
        user.role = data["role"]
    
    if "is_active" in data:
        user.is_active = data["is_active"]
    
    if "is_restricted" in data:
        user.is_restricted = data["is_restricted"]
    
    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "address": user.address,
            "birthdate": user.birthdate.isoformat() if user.birthdate else None,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "is_restricted": user.is_restricted,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }), 200

@admin_bp.route("/users/<int:user_id>/restrict", methods=["PUT"])
@jwt_required
@admin_required
def toggle_user_restriction(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Prevent admin from restricting themselves
    if user_id == request.current_user.id:
        return jsonify({"error": "Cannot restrict your own account"}), 400

    data = request.get_json()
    is_restricted = data.get("is_restricted", not user.is_restricted)
    
    user.is_restricted = is_restricted
    
    # If restricting user, also deactivate them
    if is_restricted:
        user.is_active = False

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": f"User {'restricted' if is_restricted else 'unrestricted'} successfully",
        "user": {
            "id": user.id,
            "is_restricted": user.is_restricted,
            "is_active": user.is_active
        }
    }), 200

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Prevent admin from deleting themselves
    if user_id == request.current_user.id:
        return jsonify({"error": "Cannot delete your own account"}), 400

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200

# ------------------- Dashboard Routes -------------------

@admin_bp.route("/dashboard/stats", methods=["GET"])
@jwt_required
@admin_required
def get_dashboard_stats():
    """Get admin dashboard statistics"""
    try:
        # Count total users by role
        total_users = User.query.count()
        total_owners = User.query.filter_by(role='owner').count()
        total_renters = User.query.filter_by(role='user').count()
        
        # Count total categories and rental items - handle missing columns gracefully
        total_categories = Category.query.count()
        
        from app.models.RentalItem import RentalItem
        try:
            total_rental_items = RentalItem.query.count()
        except Exception as e:
            print(f"Warning: Could not count rental items: {e}")
            total_rental_items = 0
        
        # Count total bookings - handle missing columns gracefully
        from app.models.booking import Booking
        try:
            total_bookings = Booking.query.count()
            pending_bookings = Booking.query.filter_by(status='Pending').count()
            completed_bookings = Booking.query.filter_by(status='Completed').count()
        except Exception as e:
            print(f"Warning: Could not count bookings: {e}")
            total_bookings = 0
            pending_bookings = 0
            completed_bookings = 0
        
        # Count total complaints
        from app.models.complaint import Complaint
        try:
            total_complaints = Complaint.query.count()
            pending_complaints = Complaint.query.filter_by(status='Pending').count()
        except Exception as e:
            print(f"Warning: Could not count complaints: {e}")
            total_complaints = 0
            pending_complaints = 0
        
        # Calculate total revenue (from completed bookings) - handle missing columns gracefully
        try:
            # Get payment amounts from confirmed bookings (payment_status = 'COMPLETED' and status = 'Confirmed')
            # Also include bookings that were admin_approved (from held payments)
            total_payment_amounts = db.session.query(db.func.sum(Booking.payment_amount)).filter(
                db.or_(
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.status == 'Confirmed'
                    ),
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.admin_approved == True
                    )
                )
            ).scalar() or 0
            
            # Get total service fees from confirmed bookings (this is the admin's revenue)
            # Also include bookings that were admin_approved (from held payments)
            total_service_fees = db.session.query(db.func.sum(Booking.service_fee)).filter(
                db.or_(
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.status == 'Confirmed'
                    ),
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.admin_approved == True
                    )
                )
            ).scalar() or 0
            
            # Admin revenue is ONLY the service fees (not payment amounts - those go to owners)
            total_revenue = float(total_service_fees)
            
            print(f"[REVENUE] Admin Dashboard - Payment amounts to owners: ${total_payment_amounts}")
            print(f"[REVENUE] Admin Dashboard - Service fees (admin revenue): ${total_service_fees}")
            print(f"[REVENUE] Admin Dashboard - Total admin revenue: ${total_revenue}")
            
            # Debug: Show the actual query results
            print(f"[REVENUE] Debug - Query filters applied:")
            print(f"[REVENUE] Debug - Looking for: payment_status='COMPLETED' AND (status='Confirmed' OR admin_approved=True)")
            
            # Let's also check individual bookings to see what's happening
            debug_bookings = db.session.query(Booking).filter(
                db.or_(
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.status == 'Confirmed'
                    ),
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.admin_approved == True
                    )
                )
            ).all()
            
            print(f"[REVENUE] Debug - Found {len(debug_bookings)} qualifying bookings:")
            for booking in debug_bookings[:5]:  # Show first 5
                print(f"[REVENUE] Debug - Booking #{booking.id}: status={booking.status}, payment_status={booking.payment_status}, admin_approved={booking.admin_approved}, service_fee=${booking.service_fee}")
            
        except Exception as e:
            print(f"Warning: Could not calculate revenue: {e}")
            total_revenue = 0
        
        # Count held payments
        try:
            held_payments = Booking.query.filter_by(payment_status='HELD').count()
        except Exception as e:
            print(f"Warning: Could not count held payments: {e}")
            held_payments = 0
        
        return jsonify({
            "users": {
                "total": total_users,
                "owners": total_owners,
                "renters": total_renters
            },
            "categories": total_categories,
            "rental_items": total_rental_items,
            "bookings": {
                "total": total_bookings,
                "pending": pending_bookings,
                "completed": completed_bookings
            },
            "complaints": {
                "total": total_complaints,
                "pending": pending_complaints
            },
            "revenue": float(total_revenue),
            "held_payments": held_payments
        }), 200
        
    except Exception as e:
        print(f"Dashboard stats error: {e}")
        # Return partial data instead of 500 error
        return jsonify({
            "users": {"total": 0, "owners": 0, "renters": 0},
            "categories": 0,
            "rental_items": 0,
            "bookings": {"total": 0, "pending": 0, "completed": 0},
            "complaints": {"total": 0, "pending": 0},
            "revenue": 0.0,
            "held_payments": 0,
            "error": "Some data could not be retrieved"
        }), 200

@admin_bp.route("/dashboard/revenue", methods=["GET"])
@jwt_required
@admin_required
def get_revenue_details():
    """Get detailed revenue breakdown for admin dashboard"""
    try:
        # Get all confirmed bookings with revenue details
        # Also include bookings that were admin_approved (from held payments)
        confirmed_bookings = Booking.query.filter(
            db.or_(
                db.and_(
                    Booking.payment_status == 'COMPLETED',
                    Booking.status == 'Confirmed'
                ),
                db.and_(
                    Booking.payment_status == 'COMPLETED',
                    Booking.admin_approved == True
                )
            )
        ).all()
        
        total_revenue = 0
        total_service_fees = 0
        total_payment_amounts = 0
        revenue_by_month = {}
        
        for booking in confirmed_bookings:
            payment_amount = float(booking.payment_amount or 0)
            service_fee = float(booking.service_fee or 0)
            
            total_payment_amounts += payment_amount
            total_service_fees += service_fee
            total_revenue += service_fee  # Admin revenue is ONLY service fees
            
            # Group by month for trend analysis
            if booking.payment_released_at:
                month_key = booking.payment_released_at.strftime('%Y-%m')
                if month_key not in revenue_by_month:
                    revenue_by_month[month_key] = {
                        'owner_payments': 0,  # Money that goes to owners
                        'admin_revenue': 0,   # Money that goes to admin (service fees)
                        'total_processed': 0, # Total money processed
                        'bookings_count': 0
                    }
                revenue_by_month[month_key]['owner_payments'] += payment_amount
                revenue_by_month[month_key]['admin_revenue'] += service_fee
                revenue_by_month[month_key]['total_processed'] += payment_amount + service_fee
                revenue_by_month[month_key]['bookings_count'] += 1
        
        # Get pending revenue (held payments)
        held_bookings = Booking.query.filter_by(payment_status='HELD').all()
        
        pending_revenue = 0
        pending_service_fees = 0
        for booking in held_bookings:
            pending_revenue += float(booking.payment_amount or 0) + float(booking.service_fee or 0)
            pending_service_fees += float(booking.service_fee or 0)
            
        print(f"[REVENUE] Pending revenue from held payments: ${pending_revenue}")
        print(f"[REVENUE] Pending service fees (admin): ${pending_service_fees}")
        print(f"[REVENUE] Number of held bookings: {len(held_bookings)}")
        
        return jsonify({
            "confirmed_revenue": {
                "admin_revenue": float(total_service_fees),  # Admin gets service fees
                "owner_payments": float(total_payment_amounts),  # Owners get payment amounts
                "total_processed": float(total_payment_amounts + total_service_fees),  # Total money processed
                "service_fees": float(total_service_fees),
                "bookings_count": len(confirmed_bookings)
            },
            "pending_revenue": {
                "admin_pending": float(pending_service_fees),  # Admin's pending service fees
                "owner_pending": float(pending_revenue - pending_service_fees),  # Owners' pending payments
                "total_pending": float(pending_revenue),  # Total pending money
                "service_fees": float(pending_service_fees),
                "bookings_count": len(held_bookings)
            },
            "revenue_by_month": revenue_by_month,
            "summary": {
                "admin_total_revenue": float(total_service_fees),  # This is what admin actually gets
                "owners_total_payments": float(total_payment_amounts),  # This goes to owners
                "total_money_processed": float(total_payment_amounts + total_service_fees),  # Total handled
                "pending_admin_revenue": float(pending_service_fees),
                "total_service_fees": float(total_service_fees + pending_service_fees)
            }
        }), 200
        
    except Exception as e:
        print(f"Revenue details error: {e}")
        return jsonify({
            "error": "Could not fetch revenue details",
            "details": str(e)
        }), 500

@admin_bp.route("/dashboard/activity", methods=["GET"])
@jwt_required
@admin_required
def get_recent_activity():
    """Get recent admin dashboard activity"""
    try:
        # Get recent owner requests
        recent_requests = OwnerRequest.query.order_by(OwnerRequest.submitted_at.desc()).limit(5).all()
        requests_data = []
        for req in recent_requests:
            try:
                requests_data.append({
                    "id": req.id,
                    "user_id": req.user_id,
                    "username": req.user.username if req.user else "Unknown",
                    "status": req.status,
                    "submitted_at": req.submitted_at.isoformat() if req.submitted_at else None
                })
            except Exception as e:
                print(f"Warning: Could not process owner request {req.id}: {e}")
                continue
        
        # Get recent bookings - handle missing columns gracefully
        from app.models.booking import Booking
        try:
            recent_bookings = Booking.query.order_by(Booking.created_at.desc()).limit(5).all()
            bookings_data = []
            for booking in recent_bookings:
                try:
                    # Check if columns exist before accessing them
                    booking_data = {
                        "id": booking.id,
                        "rental_item_id": getattr(booking, 'rental_item_id', None),
                        "status": getattr(booking, 'status', 'Unknown'),
                        "created_at": booking.created_at.isoformat() if booking.created_at else None
                    }
                    
                    # Only add payment_status if it exists
                    if hasattr(booking, 'payment_status'):
                        booking_data["payment_status"] = booking.payment_status
                    
                    bookings_data.append(booking_data)
                except Exception as e:
                    print(f"Warning: Could not process booking {booking.id}: {e}")
                    continue
        except Exception as e:
            print(f"Warning: Could not fetch bookings: {e}")
            bookings_data = []
        
        # Get recent complaints
        from app.models.complaint import Complaint
        try:
            recent_complaints = Complaint.query.order_by(Complaint.created_at.desc()).limit(5).all()
            complaints_data = []
            for complaint in recent_complaints:
                try:
                    complaints_data.append({
                        "id": complaint.id,
                        "complaint_type": complaint.complaint_type,
                        "status": complaint.status,
                        "created_at": complaint.created_at.isoformat() if complaint.created_at else None
                    })
                except Exception as e:
                    print(f"Warning: Could not process complaint {complaint.id}: {e}")
                    continue
        except Exception as e:
            print(f"Warning: Could not fetch complaints: {e}")
            complaints_data = []
        
        return jsonify({
            "owner_requests": requests_data,
            "bookings": bookings_data,
            "complaints": complaints_data
        }), 200
        
    except Exception as e:
        print(f"Dashboard activity error: {e}")
        # Return empty data instead of 500 error
        return jsonify({
            "owner_requests": [],
            "bookings": [],
            "complaints": [],
            "error": "Could not retrieve recent activity"
        }), 200

# ------------------- Category Routes -------------------

@admin_bp.route("/categories", methods=["POST"])
@jwt_required
@admin_required
def create_category():
    data = request.get_json()
    schema = CategorySchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    # Check for duplicate name
    if Category.query.filter_by(name=data["name"]).first():
        return jsonify({"error": "Category name already exists"}), 400

    category = Category(name=data["name"], description=data.get("description"))
    db.session.add(category)
    db.session.commit()

    return jsonify({
        "message": "Category created successfully",
        "category": schema.dump(category)
    }), 201


@admin_bp.route("/categories", methods=["GET"])
@jwt_required
@admin_required
def list_categories():
    try:
        categories = Category.query.all()
        result = []
        for cat in categories:
            try:
                reqs = []
                # Handle requirements gracefully - check if columns exist
                if hasattr(cat, 'requirements') and cat.requirements:
                    for r in cat.requirements:
                        try:
                            req_data = {
                                "id": r.id,
                                "category_id": getattr(r, 'category_id', None)
                            }
                            
                            # Use the actual database column names
                            if hasattr(r, 'name'):
                                req_data["field_name"] = r.name  # Map name to field_name for frontend
                            if hasattr(r, 'field_type'):
                                req_data["field_type"] = r.field_type
                            if hasattr(r, 'is_required'):
                                req_data["required"] = r.is_required  # Map is_required to required for frontend
                            if hasattr(r, 'placeholder'):
                                # Try to parse placeholder as options if it's JSON
                                try:
                                    import json
                                    parsed_options = json.loads(r.placeholder)
                                    req_data["options"] = parsed_options if isinstance(parsed_options, list) else []
                                except (json.JSONDecodeError, TypeError):
                                    req_data["options"] = []
                            else:
                                req_data["options"] = []
                            
                            # Add additional fields if they exist
                            if hasattr(r, 'max_images'):
                                req_data["max_images"] = r.max_images
                            
                            reqs.append(req_data)
                        except Exception as e:
                            print(f"Warning: Could not process requirement {r.id}: {e}")
                            continue
                
                result.append({
                    "id": cat.id,
                    "name": getattr(cat, 'name', 'Unknown'),
                    "description": getattr(cat, 'description', ''),
                    "requirements": reqs
                })
            except Exception as e:
                print(f"Warning: Could not process category {cat.id}: {e}")
                # Add basic category info even if requirements fail
                result.append({
                    "id": cat.id,
                    "name": getattr(cat, 'name', 'Unknown'),
                    "description": getattr(cat, 'description', ''),
                    "requirements": []
                })
                continue
        
        return jsonify({"categories": result}), 200
        
    except Exception as e:
        print(f"Error listing categories: {e}")
        return jsonify({
            "categories": [],
            "error": "Could not retrieve categories"
        }), 200


@admin_bp.route("/categories/<int:category_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    data = request.get_json()
    schema = CategorySchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    category.name = data.get("name", category.name)
    category.description = data.get("description", category.description)
    db.session.add(category)
    db.session.commit()

    # Return the updated category with requirements
    reqs = []
    try:
        if hasattr(category, 'requirements') and category.requirements:
            for r in category.requirements:
                try:
                    req_data = {
                        "id": r.id,
                        "category_id": getattr(r, 'category_id', None)
                    }
                    
                    # Add optional fields if they exist
                    if hasattr(r, 'field_name'):
                        req_data["field_name"] = r.field_name
                    if hasattr(r, 'field_type'):
                        req_data["field_type"] = r.field_type
                    if hasattr(r, 'required'):
                        req_data["required"] = r.required
                    if hasattr(r, 'options'):
                        try:
                            req_data["options"] = r.get_options() if hasattr(r, 'get_options') else []
                        except:
                            req_data["options"] = []
                    
                    reqs.append(req_data)
                except Exception as e:
                    print(f"Warning: Could not process requirement {r.id}: {e}")
                    continue
    except Exception as e:
        print(f"Warning: Could not process category requirements: {e}")
        reqs = []
    
    updated_category = {
        "id": category.id,
        "name": getattr(category, 'name', 'Unknown'),
        "description": getattr(category, 'description', ''),
        "requirements": reqs
    }

    return jsonify({
        "message": "Category updated successfully",
        "category": updated_category
    }), 200


@admin_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    # Store category info before deletion for response
    deleted_category = {
        "id": category.id,
        "name": category.name,
        "description": category.description
    }

    db.session.delete(category)
    db.session.commit()
    
    return jsonify({
        "message": "Category deleted successfully",
        "deleted_category": deleted_category
    }), 200


# ------------------- Category Requirement Routes -------------------

@admin_bp.route("/categories/<int:category_id>/requirements", methods=["POST"])
@jwt_required
@admin_required
def add_category_requirement(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    data = request.get_json()
    
    # Set default values for required fields
    field_type = data.get("field_type", "string")
    max_images = data.get("max_images", 1)  # Default to 1 if not provided
    
    # Validate max_images based on field type
    if field_type == "file":
        max_images = max(1, max_images)  # File fields need at least 1 image
    elif field_type in ["string", "number", "date", "selection"]:
        max_images = 0  # Non-file fields don't need images
    
    # Create requirement with actual database column names
    requirement = CategoryRequirement(
        category_id=category.id,
        name=data.get("field_name", ""),  # Map field_name to name
        field_type=field_type,
        is_required=data.get("required", True),  # Map required to is_required
        placeholder=data.get("placeholder", ""),
        max_images=max_images
    )
    
    # Handle options if the field supports it
    if field_type == "selection" and data.get("options"):
        try:
            import json
            requirement.placeholder = json.dumps(data.get("options", []))
        except Exception as e:
            print(f"Warning: Could not set options: {e}")

    db.session.add(requirement)
    db.session.commit()

    # Return the created requirement
    created_requirement = {
        "id": requirement.id,
        "category_id": requirement.category_id,
        "field_name": requirement.name,  # Map name back to field_name for frontend
        "field_type": requirement.field_type,
        "required": requirement.is_required,  # Map is_required back to required for frontend
        "placeholder": requirement.placeholder,
        "max_images": requirement.max_images
    }
    
    # Parse options from placeholder if it's JSON
    if requirement.placeholder:
        try:
            import json
            parsed_options = json.loads(requirement.placeholder)
            created_requirement["options"] = parsed_options if isinstance(parsed_options, list) else []
        except (json.JSONDecodeError, TypeError):
            created_requirement["options"] = []
    else:
        created_requirement["options"] = []

    return jsonify({
        "message": "Requirement added successfully",
        "requirement": created_requirement
    }), 201


@admin_bp.route("/categories/<int:category_id>/requirements/<int:req_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_category_requirement(category_id, req_id):
    requirement = CategoryRequirement.query.filter_by(id=req_id, category_id=category_id).first()
    if not requirement:
        return jsonify({"error": "Requirement not found"}), 404

    data = request.get_json()
    
    # Update fields with actual database column names
    if "field_name" in data:
        requirement.name = data["field_name"]  # Map field_name to name
    if "field_type" in data:
        requirement.field_type = data["field_type"]
    if "required" in data:
        requirement.is_required = data["required"]  # Map required to is_required
    if "placeholder" in data:
        requirement.placeholder = data["placeholder"]
    if "max_images" in data:
        # Validate max_images based on field type
        field_type = data.get("field_type", requirement.field_type)
        max_images = data["max_images"]
        if field_type == "file":
            requirement.max_images = max(1, max_images)  # File fields need at least 1 image
        elif field_type in ["string", "number", "date", "selection"]:
            requirement.max_images = 0  # Non-file fields don't need images
        else:
            requirement.max_images = max_images

    # Handle options if the field supports it
    if requirement.field_type == "selection" and data.get("options"):
        try:
            import json
            requirement.placeholder = json.dumps(data.get("options", []))
        except Exception as e:
            print(f"Warning: Could not set options: {e}")

    db.session.add(requirement)
    db.session.commit()

    # Return the updated requirement
    updated_requirement = {
        "id": requirement.id,
        "category_id": requirement.category_id,
        "field_name": requirement.name,  # Map name back to field_name for frontend
        "field_type": requirement.field_type,
        "required": requirement.is_required,  # Map is_required back to required for frontend
        "placeholder": requirement.placeholder,
        "max_images": requirement.max_images
    }
    
    # Parse options from placeholder if it's JSON
    if requirement.placeholder:
        try:
            import json
            parsed_options = json.loads(requirement.placeholder)
            updated_requirement["options"] = parsed_options if isinstance(parsed_options, list) else []
        except (json.JSONDecodeError, TypeError):
            updated_requirement["options"] = []
    else:
        updated_requirement["options"] = []

    return jsonify({
        "message": "Requirement updated successfully",
        "requirement": updated_requirement
    }), 200


@admin_bp.route("/categories/<int:category_id>/requirements/<int:req_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_category_requirement(category_id, req_id):
    requirement = CategoryRequirement.query.filter_by(id=req_id, category_id=category_id).first()
    if not requirement:
        return jsonify({"error": "Requirement not found"}), 404

    # Store requirement info before deletion for response
    deleted_requirement = {
        "id": requirement.id,
        "category_id": getattr(requirement, 'category_id', None)
    }
    
    # Add optional fields if they exist
    if hasattr(requirement, 'field_name'):
        deleted_requirement["field_name"] = requirement.field_name
    if hasattr(requirement, 'field_type'):
        deleted_requirement["field_type"] = requirement.field_type
    if hasattr(requirement, 'required'):
        deleted_requirement["required"] = requirement.required
    if hasattr(requirement, 'options'):
        try:
            deleted_requirement["options"] = requirement.get_options() if hasattr(requirement, 'get_options') else []
        except:
            deleted_requirement["options"] = []

    db.session.delete(requirement)
    db.session.commit()
    
    return jsonify({
        "message": "Requirement deleted successfully",
        "deleted_requirement": deleted_requirement
    }), 200

# ------------------- Admin Data Access Routes -------------------

@admin_bp.route("/bookings", methods=["GET"])
@jwt_required
@admin_required
def get_all_bookings():
    from app.models.booking import Booking
    from app.models.RentalItem import RentalItem
    from app.models.user import User

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    date = request.args.get('date')
    search = request.args.get('search')

    try:
        # Build query - handle missing owner_id column gracefully
        if hasattr(Booking, 'owner_id'):
            # If owner_id exists, use it
            query = db.session.query(Booking, RentalItem, User).join(
                RentalItem, Booking.rental_item_id == RentalItem.id
            ).join(
                User, Booking.owner_id == User.id
            )
        else:
            # If owner_id doesn't exist, get owner from rental item
            query = db.session.query(Booking, RentalItem, User).join(
                RentalItem, Booking.rental_item_id == RentalItem.id
            ).join(
                User, RentalItem.owner_id == User.id
            )

        # Apply filters
        if status:
            query = query.filter(Booking.status == status)
        if date:
            query = query.filter(db.func.date(Booking.created_at) == date)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    RentalItem.name.ilike(search_term),
                    User.username.ilike(search_term)
                )
            )

        # Pagination
        total = query.count()
        bookings = query.offset((page - 1) * per_page).limit(per_page).all()

        result = []
        for booking, rental_item, owner in bookings:
            try:
                print(f"\n=== DEBUG: Processing Admin Booking {booking.id} ===")
                print(f"Rental Item ID: {rental_item.id if rental_item else 'None'}")
                
                # Get category information
                category_name = "Unknown"
                if hasattr(rental_item, 'category') and rental_item.category:
                    category_name = rental_item.category.name
                    print(f"Category Name: {category_name}")
                else:
                    print(f"Category not found or not accessible")
                
                # Get meaningful item name from dynamic data
                item_name = "Unknown Item"
                item_data = {}
                
                print(f"Initial item_name: {item_name}")
                
                # First try to get category name for better item identification
                if rental_item and hasattr(rental_item, 'category') and rental_item.category:
                    category_name = rental_item.category.name
                    # Use category name as base for item name
                    item_name = f"{category_name} Item"
                    print(f"After category: item_name = {item_name}")
                else:
                    print(f"Category not available, keeping item_name as: {item_name}")
                
                # Then try to extract from dynamic data if available
                print(f"Checking dynamic_data...")
                print(f"Has dynamic_data attr: {hasattr(rental_item, 'dynamic_data')}")
                if rental_item:
                    print(f"Rental item dynamic_data: {rental_item.dynamic_data}")
                    print(f"Dynamic data type: {type(rental_item.dynamic_data)}")
                
                if rental_item and hasattr(rental_item, 'dynamic_data') and rental_item.dynamic_data:
                    print(f"Dynamic data found and not empty!")
                    try:
                        import json
                        if isinstance(rental_item.dynamic_data, str):
                            print(f"Dynamic data is string, parsing JSON...")
                            item_data = json.loads(rental_item.dynamic_data)
                            print(f"Parsed JSON data: {item_data}")
                        else:
                            print(f"Dynamic data is not string, using as-is...")
                            item_data = rental_item.dynamic_data
                            print(f"Direct data: {item_data}")
                        
                        # Try to construct a meaningful name from the actual stored data
                        print(f"Processing item_data: {item_data}")
                        if item_data:
                            print(f"Item data is not empty, processing...")
                            # Look for brand/model combinations (common in car rentals)
                            brand = item_data.get('Brand', '')
                            model = item_data.get('Model', '')
                            print(f"Brand: '{brand}', Model: '{model}'")
                            
                            if brand and model:
                                item_name = f"{brand} {model}"
                                print(f"Using brand + model: {item_name}")
                            elif brand:
                                item_name = f"{brand} {category_name}"
                                print(f"Using brand + category: {item_name}")
                            elif model:
                                item_name = f"{model} {category_name}"
                                print(f"Using model + category: {item_name}")
                            else:
                                print(f"No brand/model found, continuing...")
                            
                            # Look for property details (common in house rentals)
                            bedrooms = item_data.get('Bedrooms', '')
                            property_type = item_data.get('Property Type', '')
                            print(f"Brand: '{bedrooms}', Property Type: '{property_type}'")
                            
                            if bedrooms and property_type:
                                item_name = f"{bedrooms} Bedroom {property_type}"
                                print(f"Using bedrooms + property type: {item_name}")
                            elif property_type:
                                item_name = f"{property_type} {category_name}"
                                print(f"Using property type + category: {item_name}")
                            else:
                                print(f"No property details found, continuing...")
                            
                            # Look for device details (common in electronics)
                            device_type = item_data.get('Device Type', '')
                            device_brand = item_data.get('Brand', '')
                            print(f"Device Type: '{device_type}', Device Brand: '{device_brand}'")
                            
                            if device_type and device_brand:
                                item_name = f"{device_brand} {device_type}"
                                print(f"Using device brand + type: {item_name}")
                            elif device_type:
                                item_name = f"{device_type} {category_name}"
                                print(f"Using device type + category: {item_name}")
                            else:
                                print(f"No device details found, continuing...")
                            
                            # If still no good name, try to use any descriptive field
                            print(f"Current item_name: '{item_name}', checking if it's still category default...")
                            if item_name == f"{category_name} Item":
                                print(f"Still using category default, trying descriptive fields...")
                                for field_name, field_value in item_data.items():
                                    print(f"Checking field: '{field_name}' = '{field_value}'")
                                    if field_value and str(field_value).strip() and field_name not in ['Brand', 'Model', 'Bedrooms', 'Property Type', 'Device Type']:
                                        item_name = f"{category_name} - {str(field_value)[:30]}"
                                        print(f"Using descriptive field: {item_name}")
                                        break
                            else:
                                print(f"Item name already updated, skipping descriptive fields")
                            
                            # Final fallback: use category + ID
                            if item_name == f"{category_name} Item":
                                item_name = f"{category_name} #{rental_item.id}"
                                print(f"Using final fallback: {item_name}")
                            else:
                                print(f"Final item_name: {item_name}")
                    except Exception as e:
                        print(f"Error parsing dynamic data for admin item {rental_item.id}: {str(e)}")
                        item_data = {}
                else:
                    print(f"No dynamic data available")
                    print(f"Rental item exists: {rental_item is not None}")
                    if rental_item:
                        print(f"Has dynamic_data: {hasattr(rental_item, 'dynamic_data')}")
                        if hasattr(rental_item, 'dynamic_data'):
                            print(f"Dynamic data value: {rental_item.dynamic_data}")
                            print(f"Dynamic data truthy: {bool(rental_item.dynamic_data)}")
                
                # Final fallback if no name was found
                if item_name == "Unknown Item":
                    item_name = f"Rental Item #{rental_item.id}"
                    print(f"Using ultimate fallback: {item_name}")
                
                # Debug logging
                print(f"[DEBUG] Admin Item {rental_item.id} - Category: {category_name}, Final Name: {item_name}")
                print(f"[DEBUG] Admin Dynamic data: {item_data}")
                print(f"=== END DEBUG: Admin Booking {booking.id} ===\n")
                
            except Exception as e:
                print(f"Error processing admin booking {booking.id}: {str(e)}")
                item_name = f"Rental Item #{rental_item.id if rental_item else 'Unknown'}"
                category_name = "Unknown"
                item_data = {}
            
            booking_data = {
                "id": booking.id,
                "rental_item_id": booking.rental_item_id,
                "rental_item_name": item_name,
                "renter_id": booking.renter_id,
                "owner_username": owner.username if owner else 'Unknown',
                "requirements_data": booking.get_requirements_data() if hasattr(booking, 'get_requirements_data') else {},
                "contract_accepted": getattr(booking, 'contract_accepted', False),
                "status": getattr(booking, 'status', 'Unknown'),
                "created_at": getattr(booking, 'created_at', None),
            }
            
            # Add optional fields if they exist
            if hasattr(booking, 'payment_status'):
                booking_data["payment_status"] = booking.payment_status
            if hasattr(booking, 'payment_amount'):
                booking_data["payment_amount"] = float(booking.payment_amount)
            if hasattr(booking, 'service_fee'):
                booking_data["service_fee"] = float(booking.service_fee)
            if hasattr(booking, 'payment_method'):
                booking_data["payment_method"] = booking.payment_method
            if hasattr(booking, 'payment_account'):
                booking_data["payment_account"] = booking.payment_account
            if hasattr(booking, 'updated_at'):
                booking_data["updated_at"] = booking.updated_at
                
            # Add owner_id if it exists
            if hasattr(booking, 'owner_id'):
                booking_data["owner_id"] = booking.owner_id
            else:
                # Use rental item owner_id as fallback
                booking_data["owner_id"] = getattr(rental_item, 'owner_id', None)
            
            result.append(booking_data)

        return jsonify({
            "bookings": result,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        print(f"Error fetching bookings: {e}")
        return jsonify({
            "bookings": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "total_pages": 0,
            "error": "Could not retrieve bookings"
        }), 200

@admin_bp.route("/complaints", methods=["GET"])
@jwt_required
@admin_required
def get_all_complaints():
    from app.models.complaint import Complaint
    from app.models.booking import Booking
    from app.models.user import User

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    complaint_type = request.args.get('type')
    search = request.args.get('search')

    try:
        # Build query - handle missing columns gracefully
        query = db.session.query(Complaint, Booking, User).join(
            Booking, Complaint.booking_id == Booking.id
        ).join(
            User, Complaint.complainant_id == User.id
        )

        # Apply filters
        if status:
            query = query.filter(Complaint.status == status)
        if complaint_type:
            query = query.filter(Complaint.complaint_type == complaint_type)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Complaint.description.ilike(search_term),
                    User.username.ilike(search_term)
                )
            )

        # Pagination
        total = query.count()
        complaints = query.offset((page - 1) * per_page).limit(per_page).all()

        result = []
        for complaint, booking, complainant in complaints:
            complaint_data = {
                "id": complaint.id,
                "booking_id": complaint.booking_id,
                "complainant_username": complainant.username if complainant else 'Unknown',
                "complaint_type": getattr(complaint, 'complaint_type', 'Unknown'),
                "description": getattr(complaint, 'description', ''),
                "status": getattr(complaint, 'status', 'Unknown'),
                "created_at": getattr(complaint, 'created_at', None),
            }
            
            # Add optional fields if they exist
            if hasattr(complaint, 'defendant_id'):
                complaint_data["defendant_id"] = complaint.defendant_id
            if hasattr(complaint, 'admin_notes'):
                complaint_data["admin_notes"] = complaint.admin_notes
            if hasattr(complaint, 'updated_at'):
                complaint_data["updated_at"] = complaint.updated_at
                
            # Add booking info if available
            if booking:
                complaint_data["rental_item_id"] = getattr(booking, 'rental_item_id', None)
                complaint_data["renter_id"] = getattr(booking, 'renter_id', None)
                
                # Handle owner_id gracefully
                if hasattr(booking, 'owner_id'):
                    complaint_data["owner_id"] = booking.owner_id
                else:
                    # Try to get owner from rental item if available
                    try:
                        from app.models.RentalItem import RentalItem
                        rental_item = RentalItem.query.get(booking.rental_item_id)
                        if rental_item and hasattr(rental_item, 'owner_id'):
                            complaint_data["owner_id"] = rental_item.owner_id
                    except Exception as e:
                        print(f"Warning: Could not get rental item owner: {e}")
                        complaint_data["owner_id"] = None
            
            result.append(complaint_data)

        return jsonify({
            "complaints": result,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        print(f"Error fetching complaints: {e}")
        return jsonify({
            "complaints": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "total_pages": 0,
            "error": "Could not retrieve complaints"
        }), 200

@admin_bp.route("/payments", methods=["GET"])
@jwt_required
@admin_required
def get_all_payments():
    from app.models.booking import Booking
    from app.models.user import User

    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    method = request.args.get('method')
    date = request.args.get('date')
    search = request.args.get('search')

    try:
        # Build query - handle missing owner_id column gracefully
        if hasattr(Booking, 'owner_id'):
            # If owner_id exists, use it
            query = db.session.query(Booking, User).join(
                User, Booking.owner_id == User.id
            )
        else:
            # If owner_id doesn't exist, we need to get owner from rental item
            from app.models.RentalItem import RentalItem
            query = db.session.query(Booking, User, RentalItem).join(
                RentalItem, Booking.rental_item_id == RentalItem.id
            ).join(
                User, RentalItem.owner_id == User.id
            )

        # Apply filters
        if status:
            query = query.filter(Booking.payment_status == status)
        if method:
            query = query.filter(Booking.payment_method == method)
        if date:
            query = query.filter(db.func.date(Booking.created_at) == date)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )

        # Pagination
        total = query.count()
        payments = query.offset((page - 1) * per_page).limit(per_page).all()

        result = []
        for payment_data in payments:
            if hasattr(Booking, 'owner_id'):
                # Direct join with owner
                booking, owner = payment_data
                owner_username = owner.username if owner else 'Unknown'
            else:
                # Join through rental item
                booking, owner, rental_item = payment_data
                owner_username = owner.username if owner else 'Unknown'

            payment_info = {
                "id": booking.id,
                "booking_id": booking.id,
                "owner_username": owner_username,
                "payment_status": getattr(booking, 'payment_status', 'Unknown'),
                "payment_amount": float(getattr(booking, 'payment_amount', 0)),
                "service_fee": float(getattr(booking, 'service_fee', 0)),
                "payment_method": getattr(booking, 'payment_method', 'Unknown'),
                "payment_account": getattr(booking, 'payment_account', 'Unknown'),
                "created_at": getattr(booking, 'created_at', None),
            }
            
            # Add optional fields if they exist
            if hasattr(booking, 'released_at'):
                payment_info["released_at"] = booking.released_at
            if hasattr(booking, 'updated_at'):
                payment_info["updated_at"] = booking.updated_at
                
            # Add owner_id if it exists
            if hasattr(booking, 'owner_id'):
                payment_info["owner_id"] = booking.owner_id
            else:
                # Use rental item owner_id as fallback
                payment_info["owner_id"] = getattr(rental_item, 'owner_id', None)
            
            result.append(payment_info)

        return jsonify({
            "payments": result,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        print(f"Error fetching payments: {e}")
        return jsonify({
            "payments": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "total_pages": 0,
            "error": "Could not retrieve payments"
        }), 200


@admin_bp.route("/payments/<int:booking_id>/details", methods=["GET"])
@jwt_required
@admin_required
def get_payment_details(booking_id):
    """Get detailed payment information including user details for admin"""
    try:
        from app.models.booking import Booking
        from app.models.user import User
        from app.models.RentalItem import RentalItem
        
        # Get the booking
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Payment not found"}), 404
        
        # Get renter information
        renter = User.query.get(booking.renter_id)
        
        # Get rental item and owner information
        rental_item = RentalItem.query.get(booking.rental_item_id)
        owner = User.query.get(rental_item.owner_id) if rental_item else None
        
        payment_details = {
            "booking_id": booking.id,
            "payment_status": getattr(booking, 'payment_status', 'Unknown'),
            "payment_amount": float(getattr(booking, 'payment_amount', 0)),
            "service_fee": float(getattr(booking, 'service_fee', 0)),
            "payment_method": getattr(booking, 'payment_method', 'Unknown'),
            "payment_account": getattr(booking, 'payment_account', 'Unknown'),
            "total_amount": float(getattr(booking, 'payment_amount', 0)) + float(getattr(booking, 'service_fee', 0)),
            "created_at": getattr(booking, 'created_at', None),
            "payment_held_at": getattr(booking, 'payment_held_at', None),
            "payment_released_at": getattr(booking, 'payment_released_at', None),
            "admin_approved": getattr(booking, 'admin_approved', None),
            "admin_approved_at": getattr(booking, 'admin_approved_at', None),
            "admin_rejection_reason": getattr(booking, 'admin_rejection_reason', None),
            "renter": {
                "id": renter.id if renter else None,
                "username": renter.username if renter else 'Unknown',
                "email": renter.email if renter else 'Unknown'
            } if renter else None,
            "owner": {
                "id": owner.id if owner else None,
                "username": owner.username if owner else 'Unknown',
                "email": owner.email if owner else 'Unknown'
            } if owner else None,
            "status": getattr(booking, 'status', 'Unknown'),
            "updated_at": getattr(booking, 'updated_at', None)
        }
        
        return jsonify(payment_details), 200
        
    except Exception as e:
        print(f"Error fetching payment details: {e}")
        return jsonify({"error": "Could not retrieve payment details"}), 500

# ------------------- Owner Requirements Routes -------------------

@admin_bp.route("/owner-requirements", methods=["GET"])
@jwt_required
@admin_required
def list_owner_requirements():
    """Get all owner requirements ordered by order_index"""
    try:
        # Check if the table exists first
        try:
            requirements = OwnerRequirement.query.filter_by(is_active=True).order_by(OwnerRequirement.order_index).all()
            result = [req.to_dict() for req in requirements]
            return jsonify({"requirements": result}), 200
        except Exception as table_error:
            print(f"Database table error: {table_error}")
            # If table doesn't exist, return empty list
            if "no such table" in str(table_error).lower() or "doesn't exist" in str(table_error).lower():
                return jsonify({"requirements": [], "message": "No requirements table found. Please run database migration."}), 200
            else:
                raise table_error
    except Exception as e:
        print(f"Error in list_owner_requirements: {e}")
        return jsonify({"error": f"Error fetching requirements: {str(e)}"}), 500

@admin_bp.route("/owner-requirements", methods=["POST"])
@jwt_required
@admin_required
def create_owner_requirement():
    """Create a new owner requirement field"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('label') or not data.get('field_name') or not data.get('input_type'):
            return jsonify({"error": "Label, field_name, and input_type are required"}), 400
        
        # Check if field_name already exists
        existing = OwnerRequirement.query.filter_by(field_name=data['field_name']).first()
        if existing:
            return jsonify({"error": "Field name already exists"}), 400
        
        # Create new requirement
        requirement = OwnerRequirement(
            label=data['label'],
            field_name=data['field_name'],
            input_type=data['input_type'],
            is_required=data.get('is_required', True),
            placeholder=data.get('placeholder'),
            help_text=data.get('help_text'),
            order_index=data.get('order_index', 0),
            is_active=data.get('is_active', True)
        )
        
        # Set options if provided
        if data.get('options') and data['input_type'] == 'dropdown':
            requirement.set_options(data['options'])
        
        # Set validation rules if provided
        if data.get('validation_rules'):
            requirement.set_validation_rules(data['validation_rules'])
        
        db.session.add(requirement)
        db.session.commit()
        
        return jsonify({
            "message": "Owner requirement created successfully",
            "requirement": requirement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating owner requirement: {e}")
        # Check if it's a table error
        if "no such table" in str(e).lower() or "doesn't exist" in str(e).lower():
            return jsonify({"error": "Database table not found. Please run database migration first."}), 500
        return jsonify({"error": f"Error creating requirement: {str(e)}"}), 500

@admin_bp.route("/owner-requirements/<int:requirement_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_owner_requirement(requirement_id):
    """Update an existing owner requirement field"""
    try:
        requirement = OwnerRequirement.query.get(requirement_id)
        if not requirement:
            return jsonify({"error": "Requirement not found"}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'label' in data:
            requirement.label = data['label']
        if 'field_name' in data:
            # Check if new field_name conflicts with existing
            if data['field_name'] != requirement.field_name:
                existing = OwnerRequirement.query.filter_by(field_name=data['field_name']).first()
                if existing:
                    return jsonify({"error": "Field name already exists"}), 400
            requirement.field_name = data['field_name']
        if 'input_type' in data:
            requirement.input_type = data['input_type']
        if 'is_required' in data:
            requirement.is_required = data['is_required']
        if 'placeholder' in data:
            requirement.placeholder = data['placeholder']
        if 'help_text' in data:
            requirement.help_text = data['help_text']
        if 'order_index' in data:
            requirement.order_index = data['order_index']
        if 'is_active' in data:
            requirement.is_active = data['is_active']
        
        # Update options if provided
        if 'options' in data and data['input_type'] == 'dropdown':
            requirement.set_options(data['options'])
        
        # Update validation rules if provided
        if 'validation_rules' in data:
            requirement.set_validation_rules(data['validation_rules'])
        
        requirement.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            "message": "Owner requirement updated successfully",
            "requirement": requirement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error updating requirement: {str(e)}"}), 500

@admin_bp.route("/owner-requirements/<int:requirement_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_owner_requirement(requirement_id):
    """Delete an owner requirement field (soft delete by setting is_active to False)"""
    try:
        requirement = OwnerRequirement.query.get(requirement_id)
        if not requirement:
            return jsonify({"error": "Requirement not found"}), 404
        
        # Soft delete
        requirement.is_active = False
        db.session.commit()
        
        return jsonify({"message": "Owner requirement deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error deleting requirement: {str(e)}"}), 500

@admin_bp.route("/owner-requirements/reorder", methods=["POST"])
@jwt_required
@admin_required
def reorder_owner_requirements():
    """Reorder owner requirements by updating their order_index"""
    try:
        data = request.get_json()
        if not data.get('requirements'):
            return jsonify({"error": "Requirements order data is required"}), 400
        
        for item in data['requirements']:
            requirement = OwnerRequirement.query.get(item['id'])
            if requirement:
                requirement.order_index = item['order_index']
        
        db.session.commit()
        
        return jsonify({"message": "Requirements reordered successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error reordering requirements: {str(e)}"}), 500

# ------------------- Payment Management Routes -------------------

@admin_bp.route("/held-payments", methods=["GET"])
@jwt_required
@admin_required
def list_held_payments():
    """Get all payments that are currently held"""
    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        
        held_bookings = db.session.query(
            Booking,
            RentalItem,
            User.username.label("renter_username"),
            User.email.label("renter_email")
        ).join(
            RentalItem, Booking.rental_item_id == RentalItem.id
        ).join(
            User, Booking.renter_id == User.id
        ).filter(
            Booking.payment_status == "HELD"
        ).all()
        
        result = []
        for booking, rental_item, renter_username, renter_email in held_bookings:
            # Get owner information
            owner = User.query.get(rental_item.owner_id) if rental_item and hasattr(rental_item, 'owner_id') else None
            
            result.append({
                "booking_id": getattr(booking, 'id', 'Unknown'),
                "rental_item_id": getattr(rental_item, 'id', 'Unknown') if rental_item else 'Unknown',
                "renter": {
                    "id": getattr(booking, 'renter_id', 'Unknown'),
                    "username": renter_username or 'Unknown',
                    "email": renter_email or 'Unknown'
                },
                "owner": {
                    "id": getattr(owner, 'id', 'Unknown') if owner else None,
                    "username": getattr(owner, 'username', 'Unknown') if owner else None,
                    "email": getattr(owner, 'email', 'Unknown') if owner else None
                } if owner else None,
                "payment_amount": float(booking.payment_amount) if hasattr(booking, 'payment_amount') and booking.payment_amount else 0,
                "service_fee": float(booking.service_fee) if hasattr(booking, 'service_fee') and booking.service_fee else 0,
                "total_amount": float(booking.payment_amount or 0) + float(booking.service_fee or 0),
                "payment_method": getattr(booking, 'payment_method', 'Unknown'),
                "payment_account": getattr(booking, 'payment_account', 'Unknown'),
                "payment_held_at": booking.payment_held_at.isoformat() if hasattr(booking, 'payment_held_at') and booking.payment_held_at else None,
                "requirements_data": booking.get_requirements_data() if hasattr(booking, 'get_requirements_data') else {},
                "created_at": booking.created_at.isoformat() if hasattr(booking, 'created_at') and booking.created_at else None
            })
        
        return jsonify({
            "held_payments": result,
            "total_held": len(result)
        }), 200
        
    except Exception as e:
        print(f"Error fetching held payments: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Could not fetch held payments", "details": str(e)}), 500

@admin_bp.route("/held-payments/<int:booking_id>/approve", methods=["POST"])
@jwt_required
@admin_required
def approve_held_payment(booking_id):
    """Approve a held payment and release it to the owner"""
    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        
        data = request.get_json()
        admin_notes = data.get("admin_notes", "")
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
            
        if booking.payment_status != "HELD":
            return jsonify({"error": "Payment is not in held status"}), 400
        
        # Release the payment (approve)
        print(f"[REVENUE] 🔍 Before release - Payment #{booking.id}: status={booking.status}, payment_status={booking.payment_status}, admin_approved={booking.admin_approved}")
        print(f"[REVENUE] 🔍 Before release - Service fee: ${booking.service_fee}, Payment amount: ${booking.payment_amount}")
        
        booking.release_payment(admin_approved=True, rejection_reason=None)
        
        print(f"[REVENUE] 🔍 After release - Payment #{booking.id}: status={booking.status}, payment_status={booking.payment_status}, admin_approved={booking.admin_approved}")
        print(f"[REVENUE] 🔍 After release - Service fee: ${booking.service_fee}, Payment amount: ${booking.payment_amount}")
        
        # Keep rental item unavailable since booking is confirmed
        rental_item = RentalItem.query.get(booking.rental_item_id)
        if rental_item:
            rental_item.mark_as_unavailable()
        
        db.session.commit()
        
        # Verify the final state after commit
        db.session.refresh(booking)
        print(f"[REVENUE] 🔍 After commit - Payment #{booking.id}: status={booking.status}, payment_status={booking.payment_status}, admin_approved={booking.admin_approved}")
        print(f"[REVENUE] 🔍 After commit - Service fee: ${booking.service_fee}, Payment amount: ${booking.payment_amount}")
        
        # Log the revenue update
        print(f"[REVENUE] ✅ Payment #{booking.id} approved - Admin revenue: ${booking.service_fee}")
        print(f"[REVENUE] ✅ Total payment amount: ${booking.payment_amount}")
        print(f"[REVENUE] ✅ Payment status: {booking.payment_status}, Booking status: {booking.status}")
        
        return jsonify({
            "message": "Payment approved and released successfully",
            "booking_id": booking.id,
            "status": "COMPLETED",
            "admin_revenue": float(booking.service_fee),
            "total_amount": float(booking.payment_amount)
        }), 200
        
    except Exception as e:
        print(f"Error approving payment: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Could not approve payment", "details": str(e)}), 500

@admin_bp.route("/held-payments/<int:booking_id>/reject", methods=["POST"])
@jwt_required
@admin_required
def reject_held_payment(booking_id):
    """Reject a held payment and refund it to the renter"""
    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        
        data = request.get_json()
        rejection_reason = data.get("rejection_reason", "Admin rejected")
        
        if not rejection_reason:
            return jsonify({"error": "Rejection reason is required"}), 400
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
            
        if booking.payment_status != "HELD":
            return jsonify({"error": "Payment is not in held status"}), 400
        
        # Release the payment (reject)
        booking.release_payment(admin_approved=False, rejection_reason=rejection_reason)
        
        # Mark rental item as available again since booking was rejected
        rental_item = RentalItem.query.get(booking.rental_item_id)
        if rental_item:
            rental_item.mark_as_available()
        
        db.session.commit()
        
        # Log the rejection
        print(f"[REVENUE] ❌ Payment #{booking.id} rejected - No admin revenue generated")
        print(f"[REVENUE] ❌ Refunded amount: ${booking.payment_amount}")
        print(f"[REVENUE] ❌ Refunded service fee: ${booking.service_fee}")
        print(f"[REVENUE] ❌ Payment status: {booking.payment_status}, Booking status: {booking.status}")
        
        return jsonify({
            "message": "Payment rejected and refunded successfully",
            "booking_id": booking.id,
            "status": "FAILED",
            "rejection_reason": rejection_reason,
            "refunded_amount": float(booking.payment_amount),
            "refunded_service_fee": float(booking.service_fee)
        }), 200
        
    except Exception as e:
        print(f"Error rejecting payment: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Could not reject payment", "details": str(e)}), 500























