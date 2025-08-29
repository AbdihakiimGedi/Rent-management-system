#!/usr/bin/env python3
"""
Test script to check owner categories route
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.category import Category
from app.models.category_requirement import CategoryRequirement

def test_owner_categories():
    app = create_app()
    
    with app.app_context():
        print("=== Testing Owner Categories ===")
        
        # Check if categories exist
        categories = Category.query.all()
        print(f"Found {len(categories)} categories:")
        
        for cat in categories:
            print(f"\nCategory: {cat.name} (ID: {cat.id})")
            print(f"Description: {cat.description}")
            
            # Check if requirements relationship works
            try:
                requirements = cat.requirements
                print(f"Requirements relationship: {type(requirements)}")
                print(f"Requirements count: {len(requirements) if requirements else 0}")
                
                if requirements:
                    for req in requirements:
                        print(f"  - {req.name} ({req.field_type}) - Required: {req.is_required}")
                        if req.placeholder:
                            print(f"    Placeholder: {req.placeholder}")
            except Exception as e:
                print(f"Error accessing requirements: {e}")
        
        if not categories:
            print("No categories found in database!")
            print("You need to create some categories first.")
        
        # Check category requirements directly
        print("\n=== Direct Category Requirements Query ===")
        requirements = CategoryRequirement.query.all()
        print(f"Found {len(requirements)} category requirements:")
        
        for req in requirements:
            print(f"  - ID: {req.id}, Category: {req.category_id}, Name: {req.name}, Type: {req.field_type}")

if __name__ == "__main__":
    test_owner_categories()





