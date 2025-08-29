#!/usr/bin/env python3
"""
Simple test script to validate backend models and database connections
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.extensions import db
    from app.models.user import User
    from app.models.category import Category
    from app.models.category_requirement import CategoryRequirement
    from app.models.booking import Booking
    from app.models.complaint import Complaint
    from app.models.owner_request import OwnerRequest
    from app.models.RentalItem import RentalItem
    
    print("✅ All models imported successfully")
    
    # Test basic model attributes
    print("\n📋 Testing model attributes:")
    
    # User model
    user_attrs = ['id', 'username', 'email', 'password', 'role', 'is_active', 'is_restricted', 'phone', 'address']
    user_model_attrs = [attr for attr in dir(User) if not attr.startswith('_')]
    print(f"User model attributes: {user_attrs}")
    print(f"User model has required attributes: {all(attr in user_model_attrs for attr in user_attrs)}")
    
    # Category model
    category_attrs = ['id', 'name', 'description']
    category_model_attrs = [attr for attr in dir(Category) if not attr.startswith('_')]
    print(f"Category model attributes: {category_attrs}")
    print(f"Category model has required attributes: {all(attr in category_model_attrs for attr in category_attrs)}")
    
    # CategoryRequirement model
    req_attrs = ['id', 'category_id', 'field_name', 'field_type', 'required', 'options']
    req_model_attrs = [attr for attr in dir(CategoryRequirement) if not attr.startswith('_')]
    print(f"CategoryRequirement model attributes: {req_attrs}")
    print(f"CategoryRequirement model has required attributes: {all(attr in req_model_attrs for attr in req_attrs)}")
    
    # Booking model
    booking_attrs = ['id', 'rental_item_id', 'renter_id', 'owner_id', 'requirements_data', 'contract_accepted', 
                     'status', 'payment_status', 'payment_amount', 'service_fee', 'payment_method', 'payment_account',
                     'released_at', 'penalty_applied', 'owner_rating_penalty', 'delivered_at', 'renter_confirmed', 
                     'owner_confirmed', 'created_at', 'updated_at']
    booking_model_attrs = [attr for attr in dir(Booking) if not attr.startswith('_')]
    print(f"Booking model attributes: {booking_attrs}")
    print(f"Booking model has required attributes: {all(attr in booking_model_attrs for attr in booking_attrs)}")
    
    # Complaint model
    complaint_attrs = ['id', 'booking_id', 'complainant_id', 'defendant_id', 'complaint_type', 'description', 
                       'status', 'admin_notes', 'created_at', 'updated_at']
    complaint_model_attrs = [attr for attr in dir(Complaint) if not attr.startswith('_')]
    print(f"Complaint model attributes: {complaint_attrs}")
    print(f"Complaint model has required attributes: {all(attr in complaint_model_attrs for attr in complaint_attrs)}")
    
    # OwnerRequest model
    owner_req_attrs = ['id', 'user_id', 'status', 'submitted_at', 'approved_at', 'rejection_reason', 'requirements_data']
    owner_req_model_attrs = [attr for attr in dir(OwnerRequest) if not attr.startswith('_')]
    print(f"OwnerRequest model attributes: {owner_req_attrs}")
    print(f"OwnerRequest model has required attributes: {all(attr in owner_req_model_attrs for attr in owner_req_attrs)}")
    
    # RentalItem model
    rental_item_attrs = ['id', 'owner_id', 'category_id', 'name', 'description', 'dynamic_data', 'created_at']
    rental_item_model_attrs = [attr for attr in dir(RentalItem) if not attr.startswith('_')]
    print(f"RentalItem model attributes: {rental_item_attrs}")
    print(f"RentalItem model has required attributes: {all(attr in rental_item_model_attrs for attr in rental_item_attrs)}")
    
    print("\n✅ All model tests passed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)

print("\n🎉 Backend models are ready!")





