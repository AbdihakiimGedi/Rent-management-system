#!/usr/bin/env python3
"""
Create sample categories and requirements for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.category import Category
from app.models.category_requirement import CategoryRequirement

def create_sample_data():
    app = create_app()
    
    with app.app_context():
        print("=== Creating Sample Categories and Requirements ===")
        
        # Check if categories already exist
        existing_categories = Category.query.all()
        if existing_categories:
            print(f"Found {len(existing_categories)} existing categories:")
            for cat in existing_categories:
                print(f"  - {cat.name} (ID: {cat.id})")
            return
        
        print("No categories found. Creating sample data...")
        
        # Create Car Rental category
        car_category = Category(
            name="Car Rental",
            description="Automobile and vehicle rentals"
        )
        db.session.add(car_category)
        db.session.flush()  # Get the ID
        
        # Create House Rental category
        house_category = Category(
            name="House Rental", 
            description="Residential property rentals"
        )
        db.session.add(house_category)
        db.session.flush()  # Get the ID
        
        # Create Electronics category
        electronics_category = Category(
            name="Electronics",
            description="Electronic devices and equipment"
        )
        db.session.add(electronics_category)
        db.session.flush()  # Get the ID
        
        # Commit categories first
        db.session.commit()
        print("✓ Categories created successfully!")
        
        # Add requirements for Car Rental
        car_requirements = [
            {
                "name": "Brand",
                "field_type": "string",
                "is_required": True,
                "placeholder": "e.g., Toyota, Honda, BMW"
            },
            {
                "name": "Model",
                "field_type": "string", 
                "is_required": True,
                "placeholder": "e.g., Camry, Civic, X5"
            },
            {
                "name": "Year",
                "field_type": "number",
                "is_required": True,
                "placeholder": "e.g., 2020"
            },
            {
                "name": "Transmission",
                "field_type": "selection",
                "is_required": True,
                "placeholder": "Automatic,Manual"
            },
            {
                "name": "Fuel Type",
                "field_type": "selection",
                "is_required": False,
                "placeholder": "Gasoline,Diesel,Electric,Hybrid"
            }
        ]
        
        for req_data in car_requirements:
            req = CategoryRequirement(
                category_id=car_category.id,
                name=req_data["name"],
                field_type=req_data["field_type"],
                is_required=req_data["is_required"],
                placeholder=req_data["placeholder"],
                max_images=1
            )
            db.session.add(req)
        
        # Add requirements for House Rental
        house_requirements = [
            {
                "name": "Bedrooms",
                "field_type": "number",
                "is_required": True,
                "placeholder": "e.g., 2"
            },
            {
                "name": "Bathrooms", 
                "field_type": "number",
                "is_required": True,
                "placeholder": "e.g., 1.5"
            },
            {
                "name": "Property Type",
                "field_type": "selection",
                "is_required": True,
                "placeholder": "Apartment,House,Condo,Townhouse,Villa"
            },
            {
                "name": "Square Feet",
                "field_type": "number",
                "is_required": False,
                "placeholder": "e.g., 1200"
            },
            {
                "name": "Parking Spaces",
                "field_type": "number",
                "is_required": False,
                "placeholder": "e.g., 2"
            }
        ]
        
        for req_data in house_requirements:
            req = CategoryRequirement(
                category_id=house_category.id,
                name=req_data["name"],
                field_type=req_data["field_type"],
                is_required=req_data["is_required"],
                placeholder=req_data["placeholder"],
                max_images=1
            )
            db.session.add(req)
        
        # Add requirements for Electronics
        electronics_requirements = [
            {
                "name": "Device Type",
                "field_type": "selection",
                "is_required": True,
                "placeholder": "Laptop,Phone,Tablet,Camera,Speaker"
            },
            {
                "name": "Brand",
                "field_type": "string",
                "is_required": True,
                "placeholder": "e.g., Apple, Samsung, Dell"
            },
            {
                "name": "Model",
                "field_type": "string",
                "is_required": True,
                "placeholder": "e.g., iPhone 13, MacBook Pro"
            },
            {
                "name": "Condition",
                "field_type": "selection",
                "is_required": True,
                "placeholder": "New,Like New,Good,Fair"
            },
            {
                "name": "Warranty",
                "field_type": "selection",
                "is_required": False,
                "placeholder": "Yes,No"
            }
        ]
        
        for req_data in electronics_requirements:
            req = CategoryRequirement(
                category_id=electronics_category.id,
                name=req_data["name"],
                field_type=req_data["field_type"],
                is_required=req_data["is_required"],
                placeholder=req_data["placeholder"],
                max_images=1
            )
            db.session.add(req)
        
        # Commit all requirements
        db.session.commit()
        print("✓ Requirements created successfully!")
        
        # Verify the data
        print("\n=== Verification ===")
        categories = Category.query.all()
        for cat in categories:
            print(f"\nCategory: {cat.name}")
            requirements = CategoryRequirement.query.filter_by(category_id=cat.id).all()
            for req in requirements:
                print(f"  - {req.field_name} ({req.field_type}) - Required: {req.required}")
                if req.options:
                    print(f"    Options: {req.options}")
        
        print(f"\n✓ Successfully created {len(categories)} categories with requirements!")

if __name__ == "__main__":
    create_sample_data()





