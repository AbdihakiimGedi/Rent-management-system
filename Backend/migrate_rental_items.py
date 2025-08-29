#!/usr/bin/env python3
"""
Simple migration script to add dynamic_data column to rental_items table
Run this script to update your database schema
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.extensions import db
from app import create_app
from sqlalchemy import text

def migrate_rental_items():
    """Add dynamic_data and updated_at columns to rental_items table"""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting migration...")
            
            # Check if dynamic_data column already exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'rental_items' 
                AND COLUMN_NAME = 'dynamic_data'
            """))
            
            if result.fetchone():
                print("Column 'dynamic_data' already exists. Skipping...")
            else:
                # Add dynamic_data column
                db.session.execute(text("""
                    ALTER TABLE rental_items 
                    ADD COLUMN dynamic_data TEXT NULL 
                    COMMENT 'JSON storage for owner-submitted category requirement values'
                """))
                print("✓ Added 'dynamic_data' column")
            
            # Check if updated_at column already exists
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'rental_items' 
                AND COLUMN_NAME = 'updated_at'
            """))
            
            if result.fetchone():
                print("Column 'updated_at' already exists. Skipping...")
            else:
                # Add updated_at column
                db.session.execute(text("""
                    ALTER TABLE rental_items 
                    ADD COLUMN updated_at TIMESTAMP NULL 
                    COMMENT 'Last update timestamp'
                """))
                print("✓ Added 'updated_at' column")
                
                # Set default value for existing records
                db.session.execute(text("""
                    UPDATE rental_items 
                    SET updated_at = created_at 
                    WHERE updated_at IS NULL
                """))
                print("✓ Set default values for existing records")
                
                # Make updated_at NOT NULL
                db.session.execute(text("""
                    ALTER TABLE rental_items 
                    MODIFY COLUMN updated_at TIMESTAMP NOT NULL
                """))
                print("✓ Made 'updated_at' NOT NULL")
            
            # Commit changes
            db.session.commit()
            print("✓ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
            return False
        
        return True

if __name__ == "__main__":
    print("Rental Items Migration Script")
    print("=" * 40)
    
    success = migrate_rental_items()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("Your rental_items table now supports dynamic data storage.")
    else:
        print("\n💥 Migration failed. Please check the error messages above.")
        sys.exit(1)
