#!/usr/bin/env python3
"""
Migration script to add owner confirmation fields to the bookings table.
This script adds the new fields needed for the owner confirmation workflow.
"""

import sys
import os
from datetime import datetime

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from sqlalchemy import text

def migrate_owner_confirmation_fields():
    """Add owner confirmation fields to the bookings table"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Starting migration: Adding owner confirmation fields...")
            
            # Check if columns already exist
            with db.engine.connect() as conn:
                # Get existing columns
                result = conn.execute(text("SHOW COLUMNS FROM bookings"))
                existing_columns = [row[0] for row in result]
                
                print(f"📋 Existing columns: {existing_columns}")
                
                # Add new columns if they don't exist
                new_columns = [
                    ("owner_confirmation_status", "VARCHAR(20) DEFAULT 'PENDING' NOT NULL"),
                    ("owner_confirmed_at", "DATETIME NULL"),
                    ("owner_rejection_reason", "TEXT NULL"),
                    ("confirmation_code", "VARCHAR(6) NULL"),
                    ("code_expiry", "DATETIME NULL"),
                    ("renter_confirmed_at", "DATETIME NULL"),
                    ("owner_acceptance_time", "DATETIME NULL"),
                    ("user_confirmation_deadline", "DATETIME NULL")
                ]
                
                for column_name, column_def in new_columns:
                    if column_name not in existing_columns:
                        print(f"➕ Adding column: {column_name}")
                        sql = f"ALTER TABLE bookings ADD COLUMN {column_name} {column_def}"
                        conn.execute(text(sql))
                        print(f"✅ Added column: {column_name}")
                    else:
                        print(f"⏭️  Column already exists: {column_name}")
                
                # Update existing records to set default values
                print("🔄 Updating existing records...")
                
                # Set default owner_confirmation_status for existing records
                update_sql = """
                UPDATE bookings 
                SET owner_confirmation_status = 'PENDING' 
                WHERE owner_confirmation_status IS NULL
                """
                conn.execute(text(update_sql))
                print("✅ Updated existing records with default values")
                
                conn.commit()
            
            print("🎉 Migration completed successfully!")
            print("\n📊 New fields added:")
            for column_name, _ in new_columns:
                print(f"   • {column_name}")
            
            print("\n🚀 Your backend now supports the owner confirmation workflow!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            return False
        
        return True

if __name__ == "__main__":
    print("🚀 Owner Confirmation Fields Migration Script")
    print("=" * 50)
    
    success = migrate_owner_confirmation_fields()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("🎯 Next steps:")
        print("   1. Restart your Flask backend")
        print("   2. Test the new owner confirmation endpoints")
        print("   3. Create frontend UI for confirmation codes")
    else:
        print("\n❌ Migration failed!")
        print("🔧 Please check the error messages above and try again.")









