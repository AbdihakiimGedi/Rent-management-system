#!/usr/bin/env python3
"""
Migration Script: Add Image Columns to Rental Items
==================================================

This script adds image-related columns to the rental_items table:
- main_image: VARCHAR(500) for storing the main image URL
- additional_images: TEXT for storing JSON array of additional image URLs

Usage:
    python migrate_rental_items_images.py
"""

import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.extensions import db
from app import create_app
from sqlalchemy import text

def migrate_rental_items_images():
    """Add image columns to rental_items table"""
    print("Rental Items Image Migration Script")
    print("===================================")
    print("Starting migration...")
    
    try:
        # Check if columns already exist
        check_main_image = db.session.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'rental_items' 
            AND COLUMN_NAME = 'main_image'
        """)).fetchone()
        
        check_additional_images = db.session.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'rental_items' 
            AND COLUMN_NAME = 'additional_images'
        """)).fetchone()
        
        # Add main_image column if it doesn't exist
        if not check_main_image:
            print("Adding main_image column...")
            db.session.execute(text("""
                ALTER TABLE rental_items 
                ADD COLUMN main_image VARCHAR(500) NULL 
                COMMENT 'URL to main image for the rental item'
            """))
            print("✓ main_image column added successfully")
        else:
            print("Column 'main_image' already exists. Skipping...")
        
        # Add additional_images column if it doesn't exist
        if not check_additional_images:
            print("Adding additional_images column...")
            db.session.execute(text("""
                ALTER TABLE rental_items 
                ADD COLUMN additional_images TEXT NULL 
                COMMENT 'JSON array of additional image URLs'
            """))
            print("✓ additional_images column added successfully")
        else:
            print("Column 'additional_images' already exists. Skipping...")
        
        # Commit the changes
        db.session.commit()
        print("\n✓ Migration completed successfully!")
        print("🎉 Your rental_items table now supports image storage.")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        print("💥 Migration failed. Please check the error messages above.")
        db.session.rollback()
        return False
    
    return True

if __name__ == "__main__":
    try:
        # Create Flask app context
        app = create_app()
        
        with app.app_context():
            success = migrate_rental_items_images()
            
        if success:
            print("\n🎯 Migration completed successfully!")
            print("Your rental_items table now has image support.")
        else:
            print("\n💥 Migration failed!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Script execution failed: {str(e)}")
        sys.exit(1)




