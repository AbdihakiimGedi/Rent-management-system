from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.category import Category
from app.models.RentalItem import RentalItem
from app.models.booking import Booking
import json

rental_browsing_bp = Blueprint("rental_browsing", __name__, url_prefix="/rental-browsing")

# ------------------- Get All Categories -------------------
@rental_browsing_bp.route("/categories", methods=["GET"])
def get_categories():
    """Public endpoint to get all available categories"""
    try:
        categories = Category.query.all()
        result = []
        
        for cat in categories:
            # Count only available rental items in this category
            available_item_count = RentalItem.query.filter_by(
                category_id=cat.id,
                is_available=True
            ).count()
            
            result.append({
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "item_count": available_item_count
            })
        
        return jsonify({
            "categories": result,
            "total_categories": len(result)
        }), 200
        
    except Exception as e:
        print(f"Error getting categories: {e}")
        return jsonify({
            "categories": [],
            "total_categories": 0,
            "error": "Could not retrieve categories"
        }), 500

# ------------------- Get Rental Items by Category -------------------
@rental_browsing_bp.route("/categories/<int:category_id>/items", methods=["GET"])
def get_items_by_category(category_id):
    """Public endpoint to get available rental items for a specific category"""
    try:
        # Check if category exists
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404
        
        # Get only available rental items for this category
        rental_items = RentalItem.query.filter_by(
            category_id=category_id,
            is_available=True
        ).all()
        
        # Additional filter: exclude items with active bookings
        available_items = []
        for item in rental_items:
            # Check if item has any active bookings
            active_booking = Booking.query.filter_by(
                rental_item_id=item.id
            ).filter(
                Booking.payment_status.in_(["PENDING", "HELD", "COMPLETED"])
            ).filter(
                Booking.status.in_(["Requirements_Submitted", "Payment_Held", "Confirmed", "Active"])
            ).first()
            
            # Only include items without active bookings
            if not active_booking:
                available_items.append(item)
        
        result = []
        for item in available_items:
            # Parse dynamic data
            dynamic_data = {}
            if item.dynamic_data:
                try:
                    dynamic_data = json.loads(item.dynamic_data)
                except:
                    dynamic_data = {}
            
            # Extract basic item info
            item_info = {
                "id": item.id,
                "category_id": item.category_id,
                "owner_id": item.owner_id,
                "is_available": item.is_available,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                "dynamic_data": dynamic_data
            }
            
            result.append(item_info)
        
        return jsonify({
            "category": {
                "id": category.id,
                "name": category.name,
                "description": category.description
            },
            "items": result,
            "total_items": len(result)
        }), 200
        
    except Exception as e:
        print(f"Error getting items by category: {e}")
        return jsonify({
            "error": "Could not retrieve items for this category"
        }), 500

# ------------------- Search Rental Items -------------------
@rental_browsing_bp.route("/search", methods=["GET"])
def search_items():
    """Public endpoint to search available rental items across all categories"""
    try:
        query = request.args.get('q', '').strip()
        category_id = request.args.get('category_id', type=int)
        
        if not query and not category_id:
            return jsonify({"error": "Please provide a search query or category ID"}), 400
        
        # Build query for available items only
        items_query = RentalItem.query.filter_by(is_available=True)
        
        if category_id:
            items_query = items_query.filter_by(category_id=category_id)
        
        if query:
            # Search in dynamic data (basic text search)
            items_query = items_query.filter(
                RentalItem.dynamic_data.ilike(f'%{query}%')
            )
        
        rental_items = items_query.all()
        
        # Additional filter: exclude items with active bookings
        available_items = []
        for item in rental_items:
            # Check if item has any active bookings
            active_booking = Booking.query.filter_by(
                rental_item_id=item.id
            ).filter(
                Booking.payment_status.in_(["PENDING", "HELD", "COMPLETED"])
            ).filter(
                Booking.status.in_(["Requirements_Submitted", "Payment_Held", "Confirmed", "Active"])
            ).first()
            
            # Only include items without active bookings
            if not active_booking:
                available_items.append(item)
        
        result = []
        for item in available_items:
            # Parse dynamic data
            dynamic_data = {}
            if item.dynamic_data:
                try:
                    dynamic_data = json.loads(item.dynamic_data)
                except:
                    dynamic_data = {}
            
            # Extract basic item info
            item_info = {
                "id": item.id,
                "category_id": item.category_id,
                "owner_id": item.owner_id,
                "is_available": item.is_available,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                "dynamic_data": dynamic_data
            }
            
            result.append(item_info)
        
        return jsonify({
            "items": result,
            "total_items": len(result),
            "query": query,
            "category_id": category_id
        }), 200
        
    except Exception as e:
        print(f"Error searching items: {e}")
        return jsonify({
            "error": "Could not search items"
        }), 500

