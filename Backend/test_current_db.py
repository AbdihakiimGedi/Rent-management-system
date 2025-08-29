#!/usr/bin/env python3
"""
Test Current Database Structure
==============================

This script tests the current database to see what columns exist
and what data is stored.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from sqlalchemy import text

def test_database():
    """Test the current database structure"""
    print("Database Structure Test")
    print("=======================")
    
    try:
        # Create Flask app context
        app = create_app()
        
        with app.app_context():
            # Check what columns exist in rental_items table
            print("\n1. Checking rental_items table structure...")
            
            result = db.session.execute(text("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'rental_items' 
                ORDER BY ORDINAL_POSITION
            """))
            
            columns = result.fetchall()
            print(f"Found {len(columns)} columns:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (Nullable: {col[2]}, Default: {col[3]})")
            
            # Check if there are any rental items
            print("\n2. Checking rental items data...")
            
            result = db.session.execute(text("SELECT COUNT(*) as count FROM rental_items"))
            count = result.fetchone()[0]
            print(f"Total rental items: {count}")
            
            if count > 0:
                # Get sample data
                result = db.session.execute(text("""
                    SELECT id, owner_id, category_id, is_available, 
                           created_at, dynamic_data, updated_at
                    FROM rental_items 
                    LIMIT 3
                """))
                
                items = result.fetchall()
                print(f"\nSample items:")
                for item in items:
                    print(f"  Item ID: {item[0]}")
                    print(f"    Owner ID: {item[1]}")
                    print(f"    Category ID: {item[2]}")
                    print(f"    Available: {item[3]}")
                    print(f"    Created: {item[4]}")
                    print(f"    Dynamic Data: {item[5][:100] if item[5] else 'None'}...")
                    print(f"    Updated: {item[6]}")
                    print("    ---")
            
            # Check uploads directory
            print("\n3. Checking uploads directory...")
            uploads_dir = os.path.join(os.getcwd(), "uploads", "rental_items")
            if os.path.exists(uploads_dir):
                files = os.listdir(uploads_dir)
                print(f"Uploads directory contains {len(files)} files:")
                for file in files:
                    print(f"  - {file}")
            else:
                print("Uploads directory does not exist!")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database()

