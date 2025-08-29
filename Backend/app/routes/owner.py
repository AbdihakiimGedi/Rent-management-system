from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.owner_request import OwnerRequest
from app.schemas.owner_request_schema import OwnerRequestSubmitSchema
from app.models.category import Category

from app.models.RentalItem import RentalItem
from app.models.user import User
from app.models.RentalInputField import RenterInputField

from app.models.owner_requirement import OwnerRequirement
from app.utils.security import jwt_required, owner_required
from app.utils.file_upload import save_image_file
import os
from datetime import datetime, timedelta

owner_bp = Blueprint("owner", __name__, url_prefix="/api/owner")

# Test route to verify the app is working
@owner_bp.route("/test", methods=["GET"])
def test_route():
    """Test route to verify the Flask app is working"""
    return jsonify({"message": "Owner blueprint is working!", "status": "success"}), 200

@owner_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the owner blueprint is accessible"""
    return jsonify({
        "message": "Owner blueprint is healthy!",
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/api/owner/test",
            "/api/owner/health",
            "/api/owner/rental-items/stats",
            "/api/owner/notifications",
            "/api/owner/bookings",
            "/api/owner/payments"
        ]
    }), 200

@owner_bp.route("/debug-data", methods=["GET"])
@jwt_required
@owner_required
def debug_data():
    """Debug endpoint to see what data is actually stored"""
    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.user import User
        from app.models.category import Category
        
        # Get one rental item to inspect
        rental_item = RentalItem.query.filter_by(owner_id=request.current_user.id).first()
        if not rental_item:
            return jsonify({"error": "No rental items found"}), 404
        
        # Get the category
        category = Category.query.get(rental_item.category_id)
        
        # Get one booking for this item
        booking = Booking.query.filter_by(rental_item_id=rental_item.id).first()
        
        debug_info = {
            "rental_item": {
                "id": rental_item.id,
                "owner_id": rental_item.owner_id,
                "category_id": rental_item.category_id,
                "is_available": rental_item.is_available,
                "dynamic_data_raw": rental_item.dynamic_data,
                "dynamic_data_type": str(type(rental_item.dynamic_data)),
                "dynamic_data_parsed": rental_item.get_dynamic_data(),
                "created_at": str(rental_item.created_at) if rental_item.created_at else None,
                "updated_at": str(rental_item.updated_at) if rental_item.updated_at else None
            },
            "category": {
                "id": category.id if category else None,
                "name": category.name if category else None,
                "description": category.description if category else None
            },
            "booking": {
                "id": booking.id if booking else None,
                "rental_item_id": booking.rental_item_id if booking else None,
                "renter_id": booking.renter_id if booking else None,
                "payment_amount": str(booking.payment_amount) if booking else None,
                "payment_status": getattr(booking, 'payment_status', 'Not found') if booking else None
            } if booking else None
        }
        
        return jsonify(debug_info), 200
        
    except Exception as e:
        return jsonify({"error": f"Debug error: {str(e)}"}), 500

# ------------------- Global CORS Handler -------------------
@owner_bp.before_request
def handle_cors():
    """Handle CORS preflight requests globally"""
    if request.method == "OPTIONS":
        response = jsonify({"message": "OK"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        return response, 200

# ------------------- File Upload for Rental Items -------------------
@owner_bp.route("/upload-image", methods=["POST"])
@jwt_required
@owner_required
def upload_rental_item_image():
    """Upload an image for rental items"""
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can upload images"}), 403

    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Get field_name if provided (optional)
        field_name = request.form.get('field_name', 'unknown')

        # Save the image
        result = save_image_file(file, folder="rental_items")
        
        if result['success']:
            # Return the file path for storage in database
            response = jsonify({
                "success": True,
                "file_path": result['file_path'],
                "filename": result['filename'],
                "field_name": field_name,
                "message": "Image uploaded successfully"
            })
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response, 200
        else:
            return jsonify({"error": result['error']}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error uploading image: {str(e)}"}), 500

# ------------------- Get Owner Requirements -------------------
@owner_bp.route("/requirements", methods=["GET"])
def get_owner_requirements():
    """Get all active owner requirements for the application form"""
    try:
        requirements = OwnerRequirement.query.filter_by(is_active=True).order_by(OwnerRequirement.order_index).all()
        result = [req.to_dict() for req in requirements]
        return jsonify({"requirements": result}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching requirements: {str(e)}"}), 500

# ------------------- Get Categories for Owners -------------------
@owner_bp.route("/categories", methods=["GET"])
@jwt_required
@owner_required
def get_categories_for_owners():
    """Get all categories with their requirements for owners to create rental items"""
    try:
        if request.current_user.role != "owner":
            return jsonify({"error": "Only owners can access categories"}), 403
            
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

# ------------------- Submit Owner Request -------------------
@owner_bp.route("/request", methods=["POST"])
@jwt_required
def submit_owner_request():
    if request.current_user.role != "user":
        return jsonify({"error": "Only users can submit owner requests."}), 403

    existing_request = OwnerRequest.query.filter_by(user_id=request.current_user.id, status="Pending").first()
    if existing_request:
        return jsonify({"error": "You already have a pending owner request."}), 400

    data = request.get_json()
    schema = OwnerRequestSubmitSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    owner_request = OwnerRequest(user_id=request.current_user.id)
    owner_request.set_requirements_data(data["requirements_data"])

    db.session.add(owner_request)
    db.session.commit()

    return jsonify({
        "message": "Owner request submitted successfully.",
        "request": {
            "id": owner_request.id,
            "status": owner_request.status,
            "submitted_at": owner_request.submitted_at
        }
    }), 201


# ------------------- View Own Owner Request -------------------
@owner_bp.route("/request", methods=["GET"])
@jwt_required
def view_own_owner_request():
    owner_request = OwnerRequest.query.filter_by(user_id=request.current_user.id).first()
    if not owner_request:
        return jsonify({"message": "No owner request found."}), 404

    return jsonify({
        "id": owner_request.id,
        "status": owner_request.status,
        "submitted_at": owner_request.submitted_at,
        "approved_at": owner_request.approved_at,
        "rejection_reason": owner_request.rejection_reason,
        "requirements_data": owner_request.get_requirements_data()
    }), 200


# ------------------- Rental Item CRUD Operations -------------------

# Create Rental Item
@owner_bp.route("/rental-items", methods=["POST"])
@jwt_required
@owner_required
def submit_rental_item():
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can submit rental items."}), 403

    data = request.get_json()
    category_id = data.get("category_id")
    dynamic_data = data.get("dynamic_data", {})

    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found."}), 404

    rental_item = RentalItem(
        owner_id=request.current_user.id,
        category_id=category.id
    )
    
    # Set dynamic data if provided (only owner's submitted values)
    if dynamic_data:
        rental_item.set_dynamic_data(dynamic_data)
    
    db.session.add(rental_item)
    db.session.commit()

    return jsonify({"message": "Rental item submitted successfully", "rental_item_id": rental_item.id}), 201


# Read All Rental Items by Owner (with join info)
@owner_bp.route("/rental-items", methods=["GET"])
@jwt_required
@owner_required
def view_own_rental_items():
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can view their rental items."}), 403

    rental_items = db.session.query(
        RentalItem,
        Category.name.label("category_name"),
        User.username.label("owner_username")
    ).join(Category, RentalItem.category_id == Category.id) \
     .join(User, RentalItem.owner_id == User.id) \
     .filter(RentalItem.owner_id == request.current_user.id) \
     .all()

    # DEBUG: Log count and first few items' core fields
    try:
        print(f"[DEBUG][owner.rental-items] owner_id={getattr(request.current_user, 'id', None)} count={len(rental_items)}")
    except Exception as _e:
        pass

    result = []
    for item, category_name, owner_username in rental_items:
        dynamic_data = item.get_dynamic_data()
        # DEBUG: Print minimal structure for first 3 items
        if len(result) < 3:
            try:
                print({
                    "id": item.id,
                    "category_name": category_name,
                    "is_available": item.is_available,
                    "dynamic_keys": list(dynamic_data.keys()) if isinstance(dynamic_data, dict) else type(dynamic_data).__name__
                })
            except Exception:
                pass
        
        result.append({
            "id": item.id,
            "owner_id": item.owner_id,
            "owner_username": owner_username,
            "category_id": item.category_id,
            "category_name": category_name,
            "is_available": item.is_available,
            "dynamic_data": dynamic_data,
            "dynamic_fields_count": len(dynamic_data) if isinstance(dynamic_data, dict) else 0,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None
        })

    return jsonify({"rental_items": result}), 200


# Public route for renters to view rental items (no authentication required)
@owner_bp.route("/rental-items/public", methods=["GET"])
def get_public_rental_items():
    """Get all available rental items for renters to browse"""
    try:
        # Get query parameters for filtering
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')

        # Build base query - only show available items
        query = db.session.query(
            RentalItem,
            Category.name.label("category_name"),
            Category.description.label("category_description"),
            User.username.label("owner_username")
        ).join(Category, RentalItem.category_id == Category.id) \
         .join(User, RentalItem.owner_id == User.id) \
         .filter(RentalItem.is_available == True)

        # Apply filters
        if category_id:
            query = query.filter(RentalItem.category_id == category_id)
        if search:
            # Search in dynamic data values
            search_filter = db.or_(
                Category.name.ilike(f"%{search}%"),
                Category.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        # Get total count
        total = query.count()

        # Apply pagination
        rental_items = query.offset((page - 1) * per_page).limit(per_page).all()

        result = []
        for rental_item, category_name, category_description, owner_username in rental_items:
            # Get a sample of dynamic data for display
            dynamic_data = rental_item.get_dynamic_data()
            
            result.append({
                "id": rental_item.id,
                "owner_username": owner_username,
                "category_id": rental_item.category_id,
                "category_name": category_name,
                "category_description": category_description,
                "is_available": rental_item.is_available,
                "dynamic_data": dynamic_data,
                "dynamic_fields_count": len(dynamic_data),
                "created_at": rental_item.created_at.isoformat() if rental_item.created_at else None,
                "updated_at": rental_item.updated_at.isoformat() if rental_item.updated_at else None
            })

        return jsonify({
            "rental_items": result,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error fetching rental items: {str(e)}"}), 500


# Read Single Rental Item by ID (Owner only)
@owner_bp.route("/rental-items/<int:item_id>", methods=["GET"])
@jwt_required
@owner_required
def view_rental_item(item_id):
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can view their rental items."}), 403

    item = db.session.query(
        RentalItem,
        Category.name.label("category_name"),
        User.username.label("owner_username")
    ).join(Category, RentalItem.category_id == Category.id) \
     .join(User, RentalItem.owner_id == User.id) \
     .filter(RentalItem.id == item_id, RentalItem.owner_id == request.current_user.id) \
     .first()

    if not item:
        return jsonify({"error": "Rental item not found"}), 404

    rental_item, category_name, owner_username = item
    return jsonify({
        "id": rental_item.id,
        "owner_id": rental_item.owner_id,
        "owner_username": owner_username,
        "category_id": rental_item.category_id,
        "category_name": category_name,
        "is_available": rental_item.is_available,
        "dynamic_data": rental_item.get_dynamic_data(),
        "dynamic_fields_count": len(rental_item.get_dynamic_data()),
        "created_at": rental_item.created_at.isoformat() if rental_item.created_at else None,
        "updated_at": rental_item.updated_at.isoformat() if rental_item.updated_at else None
    }), 200


# Public route for renters to view individual rental items (no authentication required)
@owner_bp.route("/rental-items/<int:item_id>/public", methods=["GET"])
def view_public_rental_item(item_id):
    """Get a single rental item for renters to view"""
    try:
        item = db.session.query(
            RentalItem,
            Category.name.label("category_name"),
            Category.description.label("category_description"),
            User.username.label("owner_username")
        ).join(Category, RentalItem.category_id == Category.id) \
         .join(User, RentalItem.owner_id == User.id) \
         .filter(RentalItem.id == item_id, RentalItem.is_available == True) \
         .first()

        if not item:
            return jsonify({"error": "Rental item not found or not available"}), 404

        rental_item, category_name, category_description, owner_username = item
        return jsonify({
            "id": rental_item.id,
            "owner_username": owner_username,
            "category_id": rental_item.category_id,
            "category_name": category_name,
            "category_description": category_description,
            "is_available": rental_item.is_available,
            "dynamic_data": rental_item.get_dynamic_data(),
            "dynamic_fields_count": len(rental_item.get_dynamic_data()),
            "created_at": rental_item.created_at.isoformat() if rental_item.created_at else None,
            "updated_at": rental_item.updated_at.isoformat() if rental_item.updated_at else None
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error fetching rental item: {str(e)}"}), 500


# Update Rental Item
@owner_bp.route("/rental-items/<int:item_id>", methods=["PUT"])
@jwt_required
@owner_required
def update_rental_item(item_id):
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can update rental items."}), 403

    rental_item = RentalItem.query.filter_by(id=item_id, owner_id=request.current_user.id).first()
    if not rental_item:
        return jsonify({"error": "Rental item not found"}), 404

    data = request.get_json()
    
    # Update availability if provided
    if "is_available" in data:
        rental_item.is_available = data["is_available"]
    
    # Update category if provided
    if "category_id" in data:
        category = Category.query.get(data["category_id"])
        if not category:
            return jsonify({"error": "Category not found."}), 404
        rental_item.category_id = category.id
    
    # Update dynamic data if provided (only owner's submitted values)
    if "dynamic_data" in data:
        rental_item.set_dynamic_data(data["dynamic_data"])
    
    db.session.add(rental_item)
    db.session.commit()

    return jsonify({"message": "Rental item updated successfully"}), 200


# Delete Rental Item
@owner_bp.route("/rental-items/<int:item_id>", methods=["DELETE"])
@jwt_required
@owner_required
def delete_rental_item(item_id):
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can delete rental items."}), 403

    rental_item = RentalItem.query.filter_by(id=item_id, owner_id=request.current_user.id).first()
    if not rental_item:
        return jsonify({"error": "Rental item not found"}), 404

    db.session.delete(rental_item)
    db.session.commit()
    return jsonify({"message": "Rental item deleted successfully"}), 200


# ------------------- Owner Renter Input Fields (Dynamic Requirements per Item) -------------------
@owner_bp.route("/rental-items/<int:item_id>/renter-fields", methods=["GET"]) 
@jwt_required
@owner_required
def list_renter_input_fields_for_item(item_id):
    """List renter input fields (owner-defined requirements) for a specific rental item owned by current owner."""
    try:
        # Verify ownership of the rental item
        rental_item = RentalItem.query.filter_by(id=item_id, owner_id=request.current_user.id).first()
        if not rental_item:
            return jsonify({"error": "Rental item not found or not owned by you."}), 404

        fields = RenterInputField.query.filter_by(rental_item_id=item_id).order_by(RenterInputField.id.asc()).all()
        return jsonify({
            "fields": [f.to_dict() for f in fields],
            "count": len(fields)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch renter fields: {str(e)}"}), 500


@owner_bp.route("/rental-items/<int:item_id>/renter-fields", methods=["POST"]) 
@jwt_required
@owner_required
def create_renter_input_fields_for_item(item_id):
    """Create one or many renter input fields for a specific rental item owned by current owner.

    Accepts either a single object or a list of objects. Maps incoming keys to DB columns and stores
    selection options under extra_config.
    """
    try:
        # Verify ownership of the rental item
        rental_item = RentalItem.query.filter_by(id=item_id, owner_id=request.current_user.id).first()
        if not rental_item:
            return jsonify({"error": "Rental item not found or not owned by you."}), 404

        payload = request.get_json(force=True, silent=True)
        if payload is None:
            return jsonify({"error": "Request body must be JSON."}), 400

        # Normalize to list
        items = payload if isinstance(payload, list) else [payload]

        created = []
        for data in items:
            # Defensive reads with fallbacks
            label = data.get("field_name") or data.get("label") or "Field"
            field_type = data.get("field_type") or "string"
            required = data.get("required")
            if required is None:
                required = True
            field_key = data.get("field_key")
            options = data.get("options")

            renter_field = RenterInputField(
                rental_item_id=item_id,
                label=label,
                field_type=field_type,
                is_required=bool(required)
            )

            # Optional columns if present on model
            if hasattr(renter_field, "field_key"):
                renter_field.field_key = field_key

            # Store options inside extra_config
            try:
                renter_field.set_options(options if isinstance(options, list) else None)
            except Exception:
                renter_field.set_options(None)

            db.session.add(renter_field)
            db.session.commit()
            created.append(renter_field.to_dict())

        return jsonify({
            "message": "Input field(s) added successfully.",
            "created": created,
            "count": len(created)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to add input fields.",
            "details": str(e)
        }), 500


@owner_bp.route("/rental-items/<int:item_id>/renter-fields/<int:field_id>", methods=["PUT"]) 
@jwt_required
@owner_required
def update_renter_input_field_for_item(item_id, field_id):
    """Update a renter input field for a specific rental item owned by current owner."""
    try:
        # Verify ownership of the rental item
        rental_item = RentalItem.query.filter_by(id=item_id, owner_id=request.current_user.id).first()
        if not rental_item:
            return jsonify({"error": "Rental item not found or not owned by you."}), 404

        field = RenterInputField.query.filter_by(id=field_id, rental_item_id=item_id).first()
        if not field:
            return jsonify({"error": "Input field not found for this item."}), 404

        data = request.get_json(force=True, silent=True) or {}

        # Map incoming keys to model columns
        if "field_name" in data or "label" in data:
            field.label = data.get("field_name") or data.get("label") or field.label
        if "field_type" in data:
            field.field_type = data.get("field_type") or field.field_type
        if "required" in data or "is_required" in data:
            req_val = data.get("required") if "required" in data else data.get("is_required")
            field.is_required = bool(req_val)
        if "field_key" in data and hasattr(field, "field_key"):
            field.field_key = data.get("field_key")
        if "options" in data:
            try:
                field.set_options(data.get("options") if isinstance(data.get("options"), list) else None)
            except Exception:
                field.set_options(None)

        db.session.commit()
        return jsonify({
            "message": "Input field updated successfully.",
            "field": field.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update input field: {str(e)}"}), 500


@owner_bp.route("/rental-items/<int:item_id>/renter-fields/<int:field_id>", methods=["DELETE"]) 
@jwt_required
@owner_required
def delete_renter_input_field_for_item(item_id, field_id):
    """Delete a renter input field for a specific rental item owned by current owner."""
    try:
        # Verify ownership of the rental item
        rental_item = RentalItem.query.filter_by(id=item_id, owner_id=request.current_user.id).first()
        if not rental_item:
            return jsonify({"error": "Rental item not found or not owned by you."}), 404

        field = RenterInputField.query.filter_by(id=field_id, rental_item_id=item_id).first()
        if not field:
            return jsonify({"error": "Input field not found for this item."}), 404

        db.session.delete(field)
        db.session.commit()
        return jsonify({"message": "Input field deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete input field: {str(e)}"}), 500

# ------------------- Get All Rental Items with Full Details -------------------
@owner_bp.route("/rental-items/full", methods=["GET"])
@jwt_required
@owner_required
def get_all_rental_items_full():
    """Get all rental items with full details including dynamic data"""
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can view their rental items."}), 403

    try:
        # Get query parameters for filtering
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category_id = request.args.get('category_id', type=int)
        is_available = request.args.get('is_available', type=lambda v: v.lower() == 'true' if v else None)
        search = request.args.get('search', '')

        # Build base query
        query = db.session.query(
            RentalItem,
            Category.name.label("category_name"),
            Category.description.label("category_description"),
            User.username.label("owner_username"),
            User.email.label("owner_email")
        ).join(Category, RentalItem.category_id == Category.id) \
         .join(User, RentalItem.owner_id == User.id) \
         .filter(RentalItem.owner_id == request.current_user.id)

        # Apply filters
        if category_id:
            query = query.filter(RentalItem.category_id == category_id)
        if is_available is not None:
            query = query.filter(RentalItem.is_available == is_available)
        if search:
            # Search in dynamic data values
            search_filter = db.or_(
                Category.name.ilike(f'%{search}%'),
                RentalItem.dynamic_data.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)

        # Get total count for pagination
        total = query.count()
        
        # Apply pagination
        items = query.offset((page - 1) * per_page).limit(per_page).all()

        # DEBUG
        try:
            print(f"[DEBUG][owner.rental-items.full] owner_id={getattr(request.current_user, 'id', None)} page={page} per_page={per_page} total={total} page_count={(total + per_page - 1) // per_page} items_on_page={len(items)}")
        except Exception:
            pass

        result = []
        for item, category_name, category_description, owner_username, owner_email in items:
            dd = item.get_dynamic_data()
            if len(result) < 3:
                try:
                    print({
                        "id": item.id,
                        "category_name": category_name,
                        "is_available": item.is_available,
                        "dynamic_keys": list(dd.keys()) if isinstance(dd, dict) else type(dd).__name__
                    })
                except Exception:
                    pass
            result.append({
                "id": item.id,
                "owner_id": item.owner_id,
                "owner_username": owner_username,
                "owner_email": owner_email,
                "category_id": item.category_id,
                "category_name": category_name,
                "category_description": category_description,
                "is_available": item.is_available,
                "dynamic_data": dd,
                "dynamic_fields_count": len(dd) if isinstance(dd, dict) else 0,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                "status": "Available" if item.is_available else "Unavailable"
            })

        return jsonify({
            "rental_items": result,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
                "has_next": page * per_page < total,
                "has_prev": page > 1
            },
            "filters": {
                "category_id": category_id,
                "is_available": is_available,
                "search": search
            },
            "summary": {
                "total_items": total,
                "available_items": sum(1 for it in result if it["is_available"]),
                "categories_count": len(set(it["category_id"] for it in result))
            }
        }), 200

    except Exception as e:
        print(f"Error fetching rental items: {e}")
        return jsonify({"error": f"Error fetching rental items: {str(e)}"}), 500


# ------------------- Get Rental Item Statistics -------------------
@owner_bp.route("/rental-items/stats", methods=["GET"])
@jwt_required
@owner_required
def get_rental_items_stats():
    """Get statistics about owner's rental items"""
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can view their rental items."}), 403

    try:
        print(f"[DEBUG] Stats endpoint called by user ID: {request.current_user.id}")
        print(f"[DEBUG] User role: {request.current_user.role}")
        
        # Get basic counts
        total_items = RentalItem.query.filter_by(owner_id=request.current_user.id).count()
        available_items = RentalItem.query.filter_by(owner_id=request.current_user.id, is_available=True).count()
        
        print(f"[DEBUG] Total items found: {total_items}")
        print(f"[DEBUG] Available items found: {available_items}")
        
        # Get category distribution
        category_stats = db.session.query(
            Category.name,
            db.func.count(RentalItem.id).label('count')
        ).join(RentalItem, Category.id == RentalItem.category_id) \
         .filter(RentalItem.owner_id == request.current_user.id) \
         .group_by(Category.id, Category.name) \
         .all()
        
        print(f"[DEBUG] Category stats found: {category_stats}")
        
        # Get recent items
        recent_items = RentalItem.query.filter_by(owner_id=request.current_user.id) \
                                     .order_by(RentalItem.created_at.desc()) \
                                     .limit(5).all()
        
        print(f"[DEBUG] Recent items found: {len(recent_items)}")
        
        result = {
            "total_items": total_items,
            "available_items": available_items,
            "unavailable_items": total_items - available_items,
            "availability_rate": round((available_items / total_items * 100) if total_items > 0 else 0, 2),
            "category_distribution": [
                {"category": name, "count": count} for name, count in category_stats
            ],
            "recent_items": [
                {
                    "id": item.id,
                    "category_id": item.category_id,
                    "dynamic_fields_count": len(item.get_dynamic_data()),
                    "created_at": item.created_at.isoformat() if item.created_at else None
                } for item in recent_items
            ]
        }
        
        print(f"[DEBUG] Returning stats: {result}")
        return jsonify(result), 200

    except Exception as e:
        print(f"Error fetching rental item statistics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error fetching statistics: {str(e)}"}), 500


# ------------------- Owner Bookings Routes -------------------

@owner_bp.route("/bookings", methods=["GET"])
@jwt_required
@owner_required
def list_owner_bookings():
    """List bookings for items owned by the current owner (paginated)."""
    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.user import User

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', type=str)
        date = request.args.get('date', type=str)
        search = request.args.get('search', '', type=str)

        query = db.session.query(Booking, RentalItem, User).join(
            RentalItem, Booking.rental_item_id == RentalItem.id
        ).join(
            User, Booking.renter_id == User.id
        ).filter(RentalItem.owner_id == request.current_user.id)

        if status:
            query = query.filter(Booking.status.ilike(f"%{status}%"))
        if date:
            query = query.filter(db.func.date(Booking.created_at) == date)
        if search:
            query = query.filter(
                db.or_(
                    User.username.ilike(f"%{search}%"),
                    RentalItem.dynamic_data.ilike(f"%{search}%")
                )
            )

        total = query.count()
        rows = query.order_by(Booking.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

        result = []
        for booking, rental_item, renter in rows:
            item_name = None
            try:
                dd = rental_item.get_dynamic_data()
                if isinstance(dd, dict):
                    item_name = dd.get('Item Name') or dd.get('name') or dd.get('title')
            except Exception:
                item_name = None

            # Derive payment method/account with fallbacks from requirements_data
            pay_method = getattr(booking, 'payment_method', None)
            pay_account = getattr(booking, 'payment_account', None)
            if (not pay_method or not pay_account) and getattr(booking, 'requirements_data', None):
                try:
                    import json
                    rd = booking.requirements_data
                    rd = json.loads(rd) if isinstance(rd, str) else rd
                    if isinstance(rd, dict):
                        pay_method = pay_method or rd.get('payment_method') or rd.get('Payment Method') or rd.get('method')
                        pay_account = pay_account or rd.get('payment_account') or rd.get('Payment Account') or rd.get('account')
                except Exception:
                    pass

            result.append({
                "id": booking.id,
                "booking_id": booking.id,
                "rental_item_id": rental_item.id,
                "rental_item_name": item_name or f"Rental Item #{rental_item.id}",
                "renter": {"id": renter.id, "name": renter.username},
                "status": getattr(booking, 'status', 'Unknown'),
                "payment_status": getattr(booking, 'payment_status', 'PENDING'),
                "payment_amount": float(getattr(booking, 'payment_amount', 0)),
                "service_fee": float(getattr(booking, 'service_fee', 0)),
                "total_amount": float(getattr(booking, 'payment_amount', 0)) + float(getattr(booking, 'service_fee', 0)),
                "payment_method": pay_method,
                "payment_account": pay_account,
                "created_at": booking.created_at.isoformat() if booking.created_at else None
            })

        return jsonify({
            "bookings": result,
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total_items": total,
                "total_pages": (total + per_page - 1) // per_page
            }
        }), 200
    except Exception as e:
        print(f"[ERROR] list_owner_bookings: {e}")
        return jsonify({"error": f"Error fetching owner bookings: {str(e)}"}), 500

@owner_bp.route("/bookings/<int:booking_id>", methods=["GET"])
@jwt_required
@owner_required
def get_owner_booking(booking_id):
    """Get a specific booking for the owner (read-only details, no side effects)."""
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can view their bookings."}), 403

    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.user import User
        from app.models.category import Category

        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found."}), 404

        rental_item = RentalItem.query.get(booking.rental_item_id)
        if not rental_item or rental_item.owner_id != request.current_user.id:
            return jsonify({"error": "Access denied. This booking is not for your rental item."}), 403

        category = Category.query.get(rental_item.category_id) if rental_item.category_id else None
        renter = User.query.get(booking.renter_id) if booking.renter_id else None

        # Parse dynamic item data for name
        item_data = rental_item.get_dynamic_data() if hasattr(rental_item, 'get_dynamic_data') else {}
        item_name = None
        if isinstance(item_data, dict):
            item_name = item_name or item_data.get('Item Name') or item_data.get('name') or item_data.get('title')
        if not item_name and category and category.name:
            item_name = f"{category.name} Item"
        if not item_name:
            item_name = f"Rental Item #{rental_item.id}"

        booking_data = {
            "booking_id": booking.id,
            "rental_item_id": rental_item.id,
            "rental_item_name": item_name,
            "renter_id": renter.id if renter else None,
            "renter_username": renter.username if renter else None,
            "payment_amount": float(booking.payment_amount or 0),
            "service_fee": float(booking.service_fee or 0),
            "status": getattr(booking, 'status', None),
            "payment_status": getattr(booking, 'payment_status', None),
            "owner_confirmation_status": getattr(booking, 'owner_confirmation_status', None),
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
            # Additional fields needed by owner confirmation page
            "confirmation_code": getattr(booking, 'confirmation_code', None),
            "code_expiry": booking.code_expiry.isoformat() if getattr(booking, 'code_expiry', None) else None,
            "renter_confirmed": bool(getattr(booking, 'renter_confirmed', False)),
            "owner_confirmed": bool(getattr(booking, 'owner_confirmed', False)),
            "owner_acceptance_time": booking.owner_acceptance_time.isoformat() if getattr(booking, 'owner_acceptance_time', None) else None,
        }

        return jsonify({"booking": booking_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching booking details: {str(e)}"}), 500

@owner_bp.route("/bookings/<int:booking_id>/accept", methods=["POST"])
@jwt_required
@owner_required
def accept_booking(booking_id):
    """Owner accepts a booking - generates confirmation code and notifies parties."""
    try:
        if request.current_user.role != "owner":
            return jsonify({"error": "Only owners can accept bookings."}), 403

        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.notifications import Notification

        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found."}), 404

        rental_item = RentalItem.query.get(booking.rental_item_id)
        if not rental_item or rental_item.owner_id != request.current_user.id:
            return jsonify({"error": "Access denied. This booking is not for your rental item."}), 403

        if getattr(booking, 'owner_confirmation_status', 'PENDING') != "PENDING":
            return jsonify({"error": "Booking has already been processed."}), 400
        if booking.payment_status != "HELD":
            return jsonify({"error": "Payment must be held before accepting booking."}), 400

        confirmation_code = booking.owner_accept_booking()

        # Notifications
        user_notification = Notification(
            user_id=booking.renter_id,
            message=f"🎉 Your booking for {rental_item.get_dynamic_data().get('Item Name', 'Rental Item')} has been ACCEPTED!",
            type="booking_accepted"
        )
        db.session.add(user_notification)

        user_code_notification = Notification(
            user_id=booking.renter_id,
            message=f"🔐 CONFIRMATION CODE: {confirmation_code} - Enter this code to complete your rental. Expires in 24 hours.",
            type="confirmation_code"
        )
        db.session.add(user_code_notification)

        owner_notification = Notification(
            user_id=request.current_user.id,
            message=f"✅ You accepted booking for {rental_item.get_dynamic_data().get('Item Name', 'Rental Item')}",
            type="booking_accepted"
        )
        db.session.add(owner_notification)

        owner_code_notification = Notification(
            user_id=request.current_user.id,
            message=f"🔐 CONFIRMATION CODE: {confirmation_code} - Both parties must confirm with this code. Expires in 24 hours.",
            type="confirmation_code"
        )
        db.session.add(owner_code_notification)

        db.session.commit()

        return jsonify({
            "message": "Booking accepted successfully! Confirmation code sent to both parties.",
            "confirmation_code": confirmation_code,
            "expires_in": "24 hours"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error accepting booking: {str(e)}"}), 500

@owner_bp.route("/bookings/<int:booking_id>/reject", methods=["POST"])
@jwt_required
@owner_required
def reject_booking(booking_id):
    """Owner rejects a booking - triggers refund process"""
    try:
        if request.current_user.role != "owner":
            return jsonify({"error": "Only owners can reject bookings."}), 403
        
        data = request.get_json()
        rejection_reason = data.get("reason", "No reason provided")
        
        # Get the booking and verify ownership
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found."}), 404
        
        # Verify this rental item belongs to the current owner
        rental_item = RentalItem.query.get(booking.rental_item_id)
        if not rental_item or rental_item.owner_id != request.current_user.id:
            return jsonify({"error": "Access denied. This booking is not for your rental item."}), 403
        
        # Check if booking can be rejected
        if booking.owner_confirmation_status != "PENDING":
            return jsonify({"error": "Booking has already been processed."}), 400
        
        # Reject the booking
        booking.owner_reject_booking(rejection_reason)
        
        # Create system notifications for rejection
        from app.models.notifications import Notification
        
        # Notification for user about rejection
        user_notification = Notification(
            user_id=booking.renter_id,
            message=f"❌ Your booking for {rental_item.get_dynamic_data().get('Item Name', 'Rental Item')} has been REJECTED by the owner.",
            type="booking_rejected"
        )
        db.session.add(user_notification)
        
        # Detailed rejection notification with reason
        user_reason_notification = Notification(
            user_id=booking.renter_id,
            message=f"📝 Rejection Reason: {rejection_reason}. Your payment will be refunded minus service fee.",
            type="rejection_details"
        )
        db.session.add(user_reason_notification)
        
        # Notification for owner about rejection
        owner_notification = Notification(
            user_id=request.current_user.id,
            message=f"❌ You rejected booking for {rental_item.get_dynamic_data().get('Item Name', 'Rental Item')}",
            type="booking_rejected"
        )
        db.session.add(owner_notification)
        
        db.session.commit()
        
        return jsonify({
            "message": "Booking rejected successfully. User will be refunded minus service fee.",
            "status": "rejected",
            "refund_amount": float(booking.payment_amount),
            "service_fee": float(booking.service_fee)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error rejecting booking: {str(e)}"}), 500

@owner_bp.route("/bookings/<int:booking_id>/confirm-delivery", methods=["POST"])
@jwt_required
@owner_required
def confirm_delivery(booking_id):
    """Owner confirms delivery with confirmation code"""
    try:
        print(f"[CONFIRM_DELIVERY] 🔍 Owner {request.current_user.username} confirming delivery for booking {booking_id}")
        
        if request.current_user.role != "owner":
            return jsonify({"error": "Only owners can confirm delivery."}), 403
        
        data = request.get_json()
        print(f"[CONFIRM_DELIVERY] 📋 Request data: {data}")
        
        confirmation_code = data.get("confirmation_code")
        print(f"[CONFIRM_DELIVERY] 🔐 Confirmation code received: {confirmation_code}")
        
        if not confirmation_code:
            return jsonify({"error": "Confirmation code is required."}), 400
        
        # Get the booking and verify ownership
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        
        print(f"[CONFIRM_DELIVERY] 🔍 Looking for booking {booking_id}")
        booking = Booking.query.get(booking_id)
        if not booking:
            print(f"[CONFIRM_DELIVERY] ❌ Booking {booking_id} not found")
            return jsonify({"error": "Booking not found."}), 404
        
        print(f"[CONFIRM_DELIVERY] ✅ Booking found: rental_item_id={booking.rental_item_id}")
        print(f"[CONFIRM_DELIVERY] 🔍 Booking details: confirmation_code={booking.confirmation_code}, code_expiry={booking.code_expiry}")
        print(f"[CONFIRM_DELIVERY] 🔍 Booking details: owner_confirmation_status={booking.owner_confirmation_status}, owner_confirmed={booking.owner_confirmed}")
        
        # Verify this rental item belongs to the current owner
        print(f"[CONFIRM_DELIVERY] 🔍 Looking for rental item {booking.rental_item_id}")
        rental_item = RentalItem.query.get(booking.rental_item_id)
        if not rental_item:
            print(f"[CONFIRM_DELIVERY] ❌ Rental item {booking.rental_item_id} not found")
            return jsonify({"error": "Rental item not found."}), 404
        
        print(f"[CONFIRM_DELIVERY] ✅ Rental item found: owner_id={rental_item.owner_id}, current_user_id={request.current_user.id}")
        
        if rental_item.owner_id != request.current_user.id:
            print(f"[CONFIRM_DELIVERY] ❌ Access denied: rental_item.owner_id={rental_item.owner_id}, current_user.id={request.current_user.id}")
            return jsonify({"error": "Access denied. This booking is not for your rental item."}), 403
        
        print(f"[CONFIRM_DELIVERY] ✅ Ownership verified successfully")
        
        # Check if booking is in correct state
        print(f"[CONFIRM_DELIVERY] 🔍 Checking booking state: owner_confirmation_status={booking.owner_confirmation_status}, owner_confirmed={booking.owner_confirmed}")
        
        if booking.owner_confirmation_status != "ACCEPTED":
            print(f"[CONFIRM_DELIVERY] ❌ Booking not accepted: {booking.owner_confirmation_status}")
            return jsonify({"error": "Booking must be accepted before confirming delivery."}), 400
        
        if booking.owner_confirmed:
            print(f"[CONFIRM_DELIVERY] ❌ Delivery already confirmed: {booking.owner_confirmed}")
            return jsonify({"error": "Delivery already confirmed by owner."}), 400
        
        print(f"[CONFIRM_DELIVERY] ✅ Booking state validation passed")
        
        # Check if owner can confirm now (user confirmed OR 24 hours passed)
        can_confirm_now = booking.can_owner_confirm_now()
        print(f"[CONFIRM_DELIVERY] ⏰ Can confirm now: {can_confirm_now}")
        print(f"[CONFIRM_DELIVERY] 🔍 User confirmation status: renter_confirmed={booking.renter_confirmed}")
        print(f"[CONFIRM_DELIVERY] 🔍 Booking status: {booking.status}")
        print(f"[CONFIRM_DELIVERY] 🔍 Owner acceptance time: {booking.owner_acceptance_time}")
        
        if not can_confirm_now:
            if not booking.renter_confirmed:
                # Check if 24 hours have passed
                if booking.owner_acceptance_time:
                    from datetime import datetime
                    hours_passed = (datetime.utcnow() - booking.owner_acceptance_time).total_seconds() / 3600
                    print(f"[CONFIRM_DELIVERY] ⏰ Hours passed since acceptance: {hours_passed}")
                    if hours_passed < 24:
                        return jsonify({
                            "error": f"You must wait for the user to confirm delivery first, or wait {24 - int(hours_passed)} more hours for 24-hour override. Current user status: Not Confirmed"
                        }), 400
                else:
                    return jsonify({
                        "error": "You must wait for the user to confirm delivery first before you can confirm. Current user status: Not Confirmed"
                    }), 400
            else:
                return jsonify({
                    "error": "Unexpected error: Cannot determine why owner cannot confirm"
                }), 400
        
        # Confirm delivery
        print(f"[CONFIRM_DELIVERY] 🔐 Calling owner_confirm_delivery with code: {confirmation_code}")
        print(f"[CONFIRM_DELIVERY] 🔍 Current confirmation_code in booking: {booking.confirmation_code}")
        print(f"[CONFIRM_DELIVERY] 🔍 Current code_expiry in booking: {booking.code_expiry}")
        
        success, message = booking.owner_confirm_delivery(confirmation_code)
        print(f"[CONFIRM_DELIVERY] ✅ owner_confirm_delivery result: success={success}, message={message}")
        
        if not success:
            print(f"[CONFIRM_DELIVERY] ❌ Confirmation failed: {message}")
            return jsonify({"error": message}), 400
        
        print(f"[CONFIRM_DELIVERY] ✅ Confirmation successful")
        
        # Check if delivery is complete and payment should be released
        print(f"[CONFIRM_DELIVERY] 🔍 Checking if delivery is complete: {booking.is_delivery_complete()}")
        if booking.is_delivery_complete():
            print(f"[CONFIRM_DELIVERY] 🎉 Both parties confirmed - auto-releasing payment")
            # Both parties confirmed - auto-release payment
            from app.routes.payment_routes import auto_release_payment_after_confirmation
            print(f"[CONFIRM_DELIVERY] 📞 Calling auto_release_payment_after_confirmation for booking {booking.id}")
            auto_release_payment_after_confirmation(booking.id)
            print(f"[CONFIRM_DELIVERY] ✅ auto_release_payment_after_confirmation completed")
            
            # Send completion notifications
            print(f"[CONFIRM_DELIVERY] 📢 Creating completion notifications")
            from app.models.notifications import Notification
            
            # Notification for owner about completion
            owner_completion_notification = Notification(
                user_id=rental_item.owner_id,
                message=f"🎉 Rental delivery has been COMPLETED!",
                type="delivery_completed"
            )
            db.session.add(owner_completion_notification)
            
            # Detailed completion notification for owner
            owner_detail_notification = Notification(
                user_id=rental_item.owner_id,
                message=f"💰 Payment has been automatically released! Both parties confirmed successfully!",
                type="payment_released"
            )
            db.session.add(owner_detail_notification)
            
            message = "Delivery confirmed! Both parties confirmed - payment automatically released."
        else:
            message = "Delivery confirmed! Waiting for user confirmation to complete delivery."
        
        print(f"[CONFIRM_DELIVERY] 💾 Committing database changes")
        db.session.commit()
        print(f"[CONFIRM_DELIVERY] ✅ Database committed successfully")
        
        print(f"[CONFIRM_DELIVERY] 📤 Returning success response")
        return jsonify({
            "message": message,
            "data": {
            "delivery_status": "confirmed",
            "both_confirmed": booking.is_delivery_complete(),
                "renter_confirmed": booking.renter_confirmed,
                "owner_confirmed": booking.owner_confirmed,
            "payment_status": booking.payment_status
            }
        }), 200
        
    except Exception as e:
        print(f"[CONFIRM_DELIVERY] ❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        print(f"[CONFIRM_DELIVERY] 🔄 Database rolled back")
        return jsonify({"error": f"Error confirming delivery: {str(e)}"}), 500

# ------------------- OWNER NOTIFICATIONS WITH BOOKING DETAILS -------------------

@owner_bp.route("/notifications", methods=["GET"])
@jwt_required
@owner_required
def get_owner_notifications():
    """Get owner notifications with detailed booking information"""
    try:
        print(f"[DEBUG] Notifications endpoint called by user ID: {request.current_user.id}")
        print(f"[DEBUG] User role: {request.current_user.role}")
        
        if request.current_user.role != "owner":
            return jsonify({"error": "Only owners can access notifications."}), 403
        
        # Get notifications for the current owner
        from app.models.notifications import Notification
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.user import User
        
        # Get all notifications for this owner
        notifications = Notification.query.filter_by(
            user_id=request.current_user.id
        ).order_by(Notification.created_at.desc()).all()
        
        notifications_with_details = []
        
        for notification in notifications:
            notification_data = {
                "id": notification.id,
                "message": notification.message,
                "type": notification.type,
                "is_read": notification.read,
                "created_at": notification.created_at.isoformat() if notification.created_at else None,
                "booking_details": None
            }
            
            # If this is a booking-related notification, get full booking details
            if "booking" in notification.message.lower() or notification.type in ["new_booking", "booking_accepted", "booking_rejected"]:
                # Try to find the related booking
                # Look for booking ID in the message or get the most recent booking for this owner
                if "booking" in notification.message.lower():
                    # Get the most recent booking for this owner's items
                    recent_booking = db.session.query(Booking).join(
                        RentalItem, Booking.rental_item_id == RentalItem.id
                    ).filter(
                        RentalItem.owner_id == request.current_user.id
                    ).order_by(Booking.created_at.desc()).first()
                    
                    if recent_booking:
                        # Get full booking details
                        rental_item = RentalItem.query.get(recent_booking.rental_item_id)
                        renter = User.query.get(recent_booking.renter_id)
                        
                        if rental_item and renter:
                            # Parse dynamic data
                            item_data = {}
                            if rental_item.dynamic_data:
                                try:
                                    import json
                                    item_data = json.loads(rental_item.dynamic_data)
                                except:
                                    item_data = {}
                            
                            # Get requirements data
                            requirements_data = recent_booking.get_requirements_data()
                            
                            notification_data["booking_details"] = {
                                "booking_id": recent_booking.id,
                                "item_name": item_data.get('Item Name', 'Unknown Item'),
                                "item_category": item_data.get('Category', 'Unknown'),
                                "renter_name": renter.username,
                                "renter_email": renter.email,
                                "rental_period": requirements_data.get('rental_period', 'Unknown'),
                                "start_date": requirements_data.get('start_date', 'Unknown'),
                                "end_date": requirements_data.get('end_date', 'Unknown'),
                                "payment_amount": float(recent_booking.payment_amount) if recent_booking.payment_amount else 0,
                                "service_fee": float(recent_booking.service_fee) if recent_booking.service_fee else 0,
                                "total_amount": float(recent_booking.payment_amount or 0) + float(recent_booking.service_fee or 0),
                                "status": recent_booking.status,
                                "payment_status": recent_booking.payment_status,
                                "owner_confirmation_status": recent_booking.owner_confirmation_status,
                                "created_at": recent_booking.created_at.isoformat() if recent_booking.created_at else None,
                                "requirements_data": requirements_data
                            }
            
            notifications_with_details.append(notification_data)
        
        result = {
            "notifications": notifications_with_details,
            "total_count": len(notifications_with_details)
        }
        
        print(f"[DEBUG] Returning notifications: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[DEBUG] Error in notifications: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error fetching notifications: {str(e)}"}), 500

@owner_bp.route("/notifications/<int:notification_id>/mark-read", methods=["PUT"])
@jwt_required
@owner_required
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        if request.current_user.role != "owner":
            return jsonify({"error": "Only owners can mark notifications as read."}), 403
        
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

# ------------------- Owner Dashboard Endpoint -------------------
@owner_bp.route("/dashboard", methods=["GET"])
@jwt_required
@owner_required
def get_owner_dashboard():
    """Get comprehensive dashboard data for owner"""
    if request.current_user.role != "owner":
        return jsonify({"error": "Only owners can view dashboard."}), 403

    try:
        from app.models.booking import Booking
        from app.models.RentalItem import RentalItem
        from app.models.user import User
        from app.models.category import Category
        
        print(f"[DEBUG] Dashboard endpoint called by user ID: {request.current_user.id}")
        
        # Get basic rental item stats
        total_items = RentalItem.query.filter_by(owner_id=request.current_user.id).count()
        available_items = RentalItem.query.filter_by(owner_id=request.current_user.id, is_available=True).count()
        
        print(f"[DEBUG] Found {total_items} total items, {available_items} available items")
        
        # Get all bookings for this owner's items
        all_bookings = db.session.query(Booking, RentalItem, User).join(
            RentalItem, Booking.rental_item_id == RentalItem.id
        ).join(
            User, Booking.renter_id == User.id
        ).filter(RentalItem.owner_id == request.current_user.id).all()
        
        print(f"[DEBUG] Found {len(all_bookings)} total bookings")
        
        # Calculate booking statistics - make status checking more robust
        total_bookings = len(all_bookings)
        
        # Check for different possible status field names and values
        def get_booking_status(booking):
            """Get booking status from various possible field names"""
            if hasattr(booking, 'status') and booking.status:
                return str(booking.status).strip()
            elif hasattr(booking, 'booking_status') and booking.booking_status:
                return str(booking.booking_status).strip()
            elif hasattr(booking, 'state') and booking.state:
                return str(booking.state).strip()
            return None
        
        # Count bookings by status (case-insensitive)
        pending_bookings = 0
        accepted_bookings = 0
        completed_bookings = 0
        
        for b, _, _ in all_bookings:
            status = get_booking_status(b)
            if status:
                status_lower = status.lower()
                if 'pending' in status_lower:
                    pending_bookings += 1
                elif 'accepted' in status_lower or 'approved' in status_lower:
                    accepted_bookings += 1
                elif any(comp in status_lower for comp in ['completed', 'delivered', 'returned', 'finished']):
                    completed_bookings += 1
                print(f"[DEBUG] Booking {b.id} has status: '{status}' (counted as: {status_lower})")
        
        print(f"[DEBUG] Booking status breakdown:")
        print(f"[DEBUG] - Pending: {pending_bookings}")
        print(f"[DEBUG] - Accepted: {accepted_bookings}")
        print(f"[DEBUG] - Completed: {completed_bookings}")
        print(f"[DEBUG] - Total: {total_bookings}")
        
        # Debug: Show all unique booking statuses
        unique_booking_statuses = set()
        for b, _, _ in all_bookings:
            if hasattr(b, 'status') and b.status:
                unique_booking_statuses.add(b.status)
            else:
                unique_booking_statuses.add('No Status')
        print(f"[DEBUG] Found booking statuses: {unique_booking_statuses}")
        
        # Debug: Show sample booking objects to understand structure
        if all_bookings:
            sample_booking = all_bookings[0][0]  # First booking
            print(f"[DEBUG] Sample booking - ID: {sample_booking.id}, Status: {getattr(sample_booking, 'status', 'No Status')}")
            print(f"[DEBUG] Sample booking attributes: {[attr for attr in dir(sample_booking) if not attr.startswith('_')]}")
            
            # Check if status might be stored in a different field
            if hasattr(sample_booking, 'booking_status'):
                print(f"[DEBUG] Found booking_status field: {sample_booking.booking_status}")
            if hasattr(sample_booking, 'state'):
                print(f"[DEBUG] Found state field: {sample_booking.state}")
        
        print(f"[DEBUG] Booking stats: {total_bookings} total, {pending_bookings} pending, {accepted_bookings} accepted, {completed_bookings} completed")
        
        # Calculate revenue statistics
        # Count ALL revenue from all bookings regardless of payment status
        total_revenue = sum(float(b.payment_amount or 0) for b, _, _ in all_bookings)
        # Count held payments specifically
        held_payments = sum(float(b.payment_amount or 0) for b, _, _ in all_bookings if b.payment_status == 'HELD')
        
        # Also calculate revenue by payment status for detailed breakdown
        completed_payments = sum(float(b.payment_amount or 0) for b, _, _ in all_bookings if b.payment_status == 'Completed')
        pending_payments = sum(float(b.payment_amount or 0) for b, _, _ in all_bookings if b.payment_status == 'Pending')
        failed_payments = sum(float(b.payment_amount or 0) for b, _, _ in all_bookings if b.payment_status == 'Failed')
        
        print(f"[DEBUG] Revenue stats: ${total_revenue} total revenue, ${held_payments} held payments")
        print(f"[DEBUG] Detailed revenue: ${completed_payments} completed, ${pending_payments} pending, ${failed_payments} failed")
        
        # Debug: Show all unique payment statuses in the system
        unique_payment_statuses = set()
        for b, _, _ in all_bookings:
            if hasattr(b, 'payment_status') and b.payment_status:
                unique_payment_statuses.add(b.payment_status)
            else:
                unique_payment_statuses.add('No Status')
        print(f"[DEBUG] Found payment statuses: {unique_payment_statuses}")
        
        # Debug: Show sample booking data
        if all_bookings:
            sample_booking = all_bookings[0][0]  # First booking
            print(f"[DEBUG] Sample booking - ID: {sample_booking.id}, Amount: {sample_booking.payment_amount}, Status: {getattr(sample_booking, 'payment_status', 'No Status')}")
            print(f"[DEBUG] Sample booking attributes: {[attr for attr in dir(sample_booking) if not attr.startswith('_')]}")
        
        # Get recent bookings (last 10)
        recent_bookings = []
        for booking, rental_item, renter in all_bookings[:10]:
            try:
                # Parse rental item data
                item_data = {}
                if rental_item.dynamic_data:
                    try:
                        import json
                        item_data = json.loads(rental_item.dynamic_data)
                    except:
                        item_data = {}
                
                # Get category name
                category = Category.query.get(rental_item.category_id)
                category_name = category.name if category else 'Unknown'
                
                recent_bookings.append({
                    "id": booking.id,
                    "rental_item": {
                        "id": rental_item.id,
                        "name": item_data.get('Item Name', f"{category_name} Item"),
                        "image_url": item_data.get('Image URL', '/placeholder-item.jpg'),
                        "category": {"name": category_name}
                    },
                    "renter": {
                        "id": renter.id,
                        "name": renter.username,
                        "email": renter.email
                    },
                    "status": get_booking_status(booking) or 'Unknown',
                    "payment_status": getattr(booking, 'payment_status', 'Unknown'),
                    "total_amount": float(booking.payment_amount or 0),
                    "created_at": booking.created_at.isoformat() if booking.created_at else None
                })
            except Exception as e:
                print(f"Error processing recent booking {booking.id}: {e}")
                continue
        
        # Get rental items list
        rental_items = []
        owner_items = RentalItem.query.filter_by(owner_id=request.current_user.id).all()
        print(f"[DEBUG] Processing {len(owner_items)} rental items")
        
        for item in owner_items:
            try:
                category = Category.query.get(item.category_id)
                item_data = {}
                if item.dynamic_data:
                    try:
                        import json
                        item_data = json.loads(item.dynamic_data)
                    except:
                        item_data = {}
                
                rental_items.append({
                    "id": item.id,
                    "name": item_data.get('Item Name', f"{category.name if category else 'Unknown'} Item"),
                    "image_url": item_data.get('Image URL', '/placeholder-item.jpg'),
                    "category": {"name": category.name if category else 'Unknown'},
                    "availability_status": "Available" if item.is_available else "Unavailable",
                    "price_per_day": float(item_data.get('Daily Rate', 0)) if item_data.get('Daily Rate') else 0
                })
            except Exception as e:
                print(f"Error processing rental item {item.id}: {e}")
                continue
        
        # Get payment history
        payments = []
        for booking, rental_item, renter in all_bookings:
            try:
                item_data = {}
                if rental_item.dynamic_data:
                    try:
                        import json
                        item_data = json.loads(rental_item.dynamic_data)
                    except:
                        item_data = {}
                
                payments.append({
                    "id": booking.id,
                    "booking_id": booking.id,
                    "amount": float(booking.payment_amount or 0),
                    "status": getattr(booking, 'payment_status', 'Unknown'),
                    "rental_item": {
                        "name": item_data.get('Item Name', 'Unknown Item')
                    }
                })
            except Exception as e:
                print(f"Error processing payment {booking.id}: {e}")
                continue
        
        # Get accepted bookings waiting for delivery confirmation
        accepted_bookings = []
        for booking, rental_item, renter in all_bookings:
            status = get_booking_status(booking)
            if status and ('accepted' in status.lower() or 'approved' in status.lower()):
                try:
                    item_data = {}
                    if rental_item.dynamic_data:
                        try:
                            import json
                            item_data = json.loads(rental_item.dynamic_data)
                        except:
                            item_data = {}
                    
                    accepted_bookings.append({
                        "id": booking.id,
                        "rental_item": {
                            "id": rental_item.id,
                            "name": item_data.get('Item Name', 'Unknown Item'),
                            "image_url": item_data.get('Image URL', '/placeholder-item.jpg')
                        },
                        "renter": {
                            "name": renter.username
                        },
                        "created_at": booking.created_at.isoformat() if booking.created_at else None
                    })
                except Exception as e:
                    print(f"Error processing accepted booking {booking.id}: {e}")
                    continue
        
        print(f"[DEBUG] Accepted bookings found: {len(accepted_bookings)}")
        if accepted_bookings:
            print(f"[DEBUG] Sample accepted booking: {accepted_bookings[0]}")
        
        # Debug: Show what statuses are being returned in recent bookings
        print(f"[DEBUG] Recent bookings statuses:")
        for i, (booking, _, _) in enumerate(all_bookings[:5]):  # Show first 5
            status = get_booking_status(booking)
            print(f"[DEBUG] - Recent booking {i+1}: ID={booking.id}, Status='{status}'")
        
        # Get category statistics
        category_stats = []
        
        try:
            # Get all categories that have rental items for this owner
            owner_categories = db.session.query(Category).join(
                RentalItem, Category.id == RentalItem.category_id
            ).filter(
                RentalItem.owner_id == request.current_user.id
            ).distinct().all()
            
            print(f"[DEBUG] Found {len(owner_categories)} categories for owner")
            
            for category in owner_categories:
                try:
                    # Count items in this category
                    item_count = RentalItem.query.filter_by(
                        owner_id=request.current_user.id,
                        category_id=category.id
                    ).count()
                    
                    # Count bookings for items in this category
                    booking_count = db.session.query(Booking).join(
                        RentalItem, Booking.rental_item_id == RentalItem.id
                    ).filter(
                        RentalItem.owner_id == request.current_user.id,
                        RentalItem.category_id == category.id
                    ).count()
                    
                    # Calculate revenue for this category
                    cat_revenue = sum(float(b.payment_amount or 0) for b, ri, _ in all_bookings 
                                    if ri.category_id == category.id)
                    
                    category_stats.append({
                        "category_id": category.id,
                        "category_name": category.name,
                        "total_items": item_count,
                        "total_bookings": booking_count,
                        "total_revenue": cat_revenue
                    })
                    
                    print(f"[DEBUG] Category {category.name}: {item_count} items, {booking_count} bookings, ${cat_revenue} revenue")
                    
                except Exception as cat_error:
                    print(f"[DEBUG] Error processing category {category.name}: {cat_error}")
                    continue
                    
        except Exception as cat_stats_error:
            print(f"[DEBUG] Error getting category statistics: {cat_stats_error}")
            # Continue without category stats if there's an error
        

        
        dashboard_data = {
            "totalBookings": total_bookings,
            "totalRevenue": total_revenue,
            "totalItems": total_items,
            "heldPayments": held_payments,
            "recentBookings": recent_bookings,
            "rentalItems": rental_items,
            "payments": payments,
            "acceptedBookings": accepted_bookings,
            "categoryStats": category_stats,
            "stats": {
                "pendingBookings": pending_bookings,
                "acceptedBookings": accepted_bookings,
                "completedBookings": completed_bookings,
                "availableItems": available_items,
                "unavailableItems": total_items - available_items
            },
            "revenueBreakdown": {
                "totalRevenue": total_revenue,
                "completedPayments": completed_payments,
                "pendingPayments": pending_payments,
                "heldPayments": held_payments,
                "failedPayments": failed_payments
            }
        }
        
        print(f"[DEBUG] Dashboard data prepared successfully")
        print(f"[DEBUG] Summary: {total_bookings} bookings, ${total_revenue} revenue, {total_items} items, {len(category_stats)} categories")
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error fetching dashboard data: {str(e)}"}), 500
