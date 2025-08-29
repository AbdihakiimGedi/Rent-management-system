#!/usr/bin/env python3
"""
Test Image Upload and Storage
=============================

This script tests if images are being uploaded and stored correctly.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.RentalItem import RentalItem
import json

def test_image_storage():
    """Test if images are being stored correctly"""
    print("Image Storage Test")
    print("==================")
    
    try:
        # Create Flask app context
        app = create_app()
        
        with app.app_context():
            # Check uploads directory
            uploads_dir = os.path.join(os.getcwd(), "uploads", "rental_items")
            print(f"\n1. Uploads directory: {uploads_dir}")
            
            if os.path.exists(uploads_dir):
                files = os.listdir(uploads_dir)
                print(f"   Contains {len(files)} files:")
                for file in files:
                    file_path = os.path.join(uploads_dir, file)
                    file_size = os.path.getsize(file_path)
                    print(f"   - {file} ({file_size} bytes)")
            else:
                print("   Directory does not exist!")
            
            # Check rental items with images
            print(f"\n2. Rental items with images:")
            rental_items = RentalItem.query.all()
            
            for item in rental_items:
                print(f"\n   Item ID: {item.id}")
                if item.dynamic_data:
                    try:
                        data = json.loads(item.dynamic_data)
                        image_fields = []
                        for key, value in data.items():
                            if isinstance(value, str) and value.startswith('rental_items/'):
                                image_fields.append(f"{key}: {value}")
                        
                        if image_fields:
                            print(f"     Images: {', '.join(image_fields)}")
                            
                            # Check if image files actually exist
                            for key, value in data.items():
                                if isinstance(value, str) and value.startswith('rental_items/'):
                                    full_path = os.path.join(uploads_dir, value)
                                    if os.path.exists(full_path):
                                        print(f"     ✓ {key}: File exists ({os.path.getsize(full_path)} bytes)")
                                    else:
                                        print(f"     ❌ {key}: File missing - {full_path}")
                        else:
                            print(f"     No image fields found")
                            print(f"     All fields: {list(data.keys())}")
                    except json.JSONDecodeError as e:
                        print(f"     JSON error: {e}")
                else:
                    print(f"     No dynamic_data")
                    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_image_storage()

