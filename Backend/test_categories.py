#!/usr/bin/env python3
"""
Test script to check categories in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.category import Category
from app.models.category_requirement import CategoryRequirement

def test_categories():
    app = create_app()
    
    with app.app_context():
        print("=== Testing Categories ===")
        
        # Check if categories exist
        categories = Category.query.all()
        print(f"Found {len(categories)} categories:")
        
        for cat in categories:
            print(f"\nCategory: {cat.name} (ID: {cat.id})")
            print(f"Description: {cat.description}")
            
            # Get requirements for this category
            requirements = CategoryRequirement.query.filter_by(category_id=cat.id).all()
            print(f"Requirements: {len(requirements)}")
            
            for req in requirements:
                print(f"  - {req.field_name} ({req.field_type}) - Required: {req.required}")
                if req.options:
                    print(f"    Options: {req.options}")
        
        if not categories:
            print("\nNo categories found. Creating sample categories...")
            
            # Create sample categories
            car_category = Category(name="Car Rental", description="Automobile rentals")
            db.session.add(car_category)
            
            house_category = Category(name="House Rental", description="Residential property rentals")
            db.session.add(house_category)
            
            db.session.commit()
            
            print("Sample categories created!")
            
            # Add some requirements
            car_req1 = CategoryRequirement(
                category_id=car_category.id,
                name="Brand",
                field_type="string",
                is_required=True
            )
            db.session.add(car_req1)
            
            car_req2 = CategoryRequirement(
                category_id=car_category.id,
                name="Model",
                field_type="string",
                is_required=True
            )
            db.session.add(car_req2)
            
            car_req3 = CategoryRequirement(
                category_id=car_category.id,
                name="Year",
                field_type="number",
                is_required=True
            )
            db.session.add(car_req3)
            
            house_req1 = CategoryRequirement(
                category_id=house_category.id,
                name="Bedrooms",
                field_type="number",
                is_required=True
            )
            db.session.add(house_req1)
            
            house_req2 = CategoryRequirement(
                category_id=house_category.id,
                name="Bathrooms",
                field_type="number",
                is_required=True
            )
            db.session.add(house_req2)
            
            house_req3 = CategoryRequirement(
                category_id=house_category.id,
                name="Property Type",
                field_type="selection",
                is_required=True
            )
            house_req3.set_options(["Apartment", "House", "Condo", "Villa"])
            db.session.add(house_req3)
            
            db.session.commit()
            print("Sample requirements added!")

if __name__ == "__main__":
    test_categories()





