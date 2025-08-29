#!/usr/bin/env python3
"""
Simple test script to check database table structure
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.extensions import db
    from app import create_app
    
    # Create app context
    app = create_app()
    with app.app_context():
        # Test database connection
        print("✅ Database connection successful")
        
        # Check if tables exist
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📋 Available tables: {tables}")
        
        # Check users table structure
        if 'users' in tables:
            print("\n🔍 Users table structure:")
            columns = inspector.get_columns('users')
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
        
        # Check bookings table structure
        if 'bookings' in tables:
            print("\n🔍 Bookings table structure:")
            columns = inspector.get_columns('bookings')
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
        
        # Check rental_items table structure
        if 'rental_items' in tables:
            print("\n🔍 Rental_items table structure:")
            columns = inspector.get_columns('rental_items')
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
        
        # Check categories table structure
        if 'categories' in tables:
            print("\n🔍 Categories table structure:")
            columns = inspector.get_columns('categories')
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
        
        print("\n✅ Database structure check completed!")

except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)





