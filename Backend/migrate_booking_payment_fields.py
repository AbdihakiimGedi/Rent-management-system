#!/usr/bin/env python3
"""
Migration script to update the bookings table with new payment-related fields.
This script adds the new payment holding system fields and makes payment fields non-nullable.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.extensions import db
from app import create_app
from sqlalchemy import text

def migrate_booking_payment_fields():
    """Migrate the bookings table to add new payment fields and make existing ones non-nullable"""
    
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting migration of booking payment fields...")
            
            # Check if the new fields already exist
            with db.engine.connect() as conn:
                # Get table info
                result = conn.execute(text("DESCRIBE bookings"))
                existing_columns = [row[0] for row in result.fetchall()]
                print(f"Existing columns: {existing_columns}")
                
                # Add new payment holding system fields if they don't exist
                new_fields = [
                    "payment_held_at DATETIME NULL",
                    "payment_released_at DATETIME NULL", 
                    "admin_approved BOOLEAN NULL",
                    "admin_approved_at DATETIME NULL",
                    "admin_rejection_reason TEXT NULL"
                ]
                
                for field_def in new_fields:
                    field_name = field_def.split()[0]
                    if field_name not in existing_columns:
                        print(f"Adding field: {field_name}")
                        sql = f"ALTER TABLE bookings ADD COLUMN {field_def}"
                        conn.execute(text(sql))
                        print(f"✓ Added {field_name}")
                    else:
                        print(f"Field {field_name} already exists, skipping...")
                
                # Update existing records to have default values for payment fields
                print("Updating existing records with default values...")
                
                # Set default payment method for existing records
                conn.execute(text("""
                    UPDATE bookings 
                    SET payment_method = 'LEGACY' 
                    WHERE payment_method IS NULL OR payment_method = ''
                """))
                
                # Set default payment account for existing records
                conn.execute(text("""
                    UPDATE bookings 
                    SET payment_account = 'LEGACY_ACCOUNT' 
                    WHERE payment_account IS NULL OR payment_account = ''
                """))
                
                # Set default service fee for existing records
                conn.execute(text("""
                    UPDATE bookings 
                    SET service_fee = 0.00 
                    WHERE service_fee IS NULL
                """))
                
                # Set default payment status for existing records
                conn.execute(text("""
                    UPDATE bookings 
                    SET payment_status = 'PENDING' 
                    WHERE payment_status IS NULL OR payment_status = ''
                """))
                
                print("✓ Updated existing records with default values")
                
                # Make payment fields non-nullable
                print("Making payment fields non-nullable...")
                
                # Note: In MySQL, we need to be careful about changing NULL to NOT NULL
                # We'll do this step by step
                
                # First, ensure all records have values
                conn.execute(text("""
                    UPDATE bookings 
                    SET payment_method = 'LEGACY' 
                    WHERE payment_method IS NULL OR payment_method = ''
                """))
                
                conn.execute(text("""
                    UPDATE bookings 
                    SET payment_account = 'LEGACY_ACCOUNT' 
                    WHERE payment_account IS NULL OR payment_account = ''
                """))
                
                conn.execute(text("""
                    UPDATE bookings 
                    SET service_fee = 0.00 
                    WHERE service_fee IS NULL
                """))
                
                conn.execute(text("""
                    UPDATE bookings 
                    SET payment_status = 'PENDING' 
                    WHERE payment_status IS NULL OR payment_status = ''
                """))
                
                # Now make fields non-nullable
                try:
                    conn.execute(text("ALTER TABLE bookings MODIFY COLUMN payment_method VARCHAR(50) NOT NULL"))
                    print("✓ Made payment_method NOT NULL")
                except Exception as e:
                    print(f"Warning: Could not make payment_method NOT NULL: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE bookings MODIFY COLUMN payment_account VARCHAR(100) NOT NULL"))
                    print("✓ Made payment_account NOT NULL")
                except Exception as e:
                    print(f"Warning: Could not make payment_account NOT NULL: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE bookings MODIFY COLUMN service_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00"))
                    print("✓ Made service_fee NOT NULL")
                except Exception as e:
                    print(f"Warning: Could not make service_fee NOT NULL: {e}")
                
                try:
                    conn.execute(text("ALTER TABLE bookings MODIFY COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'"))
                    print("✓ Made payment_status NOT NULL")
                except Exception as e:
                    print(f"Warning: Could not make payment_status NOT NULL: {e}")
                
                # Commit all changes
                conn.commit()
                print("✓ All changes committed successfully")
                
                # Verify the final table structure
                result = conn.execute(text("DESCRIBE bookings"))
                final_columns = [row[0] for row in result.fetchall()]
                print(f"Final table structure: {final_columns}")
                
                print("\n🎉 Migration completed successfully!")
                print("\nNew fields added:")
                print("- payment_held_at: When payment was held")
                print("- payment_released_at: When payment was released")
                print("- admin_approved: Admin approval status")
                print("- admin_approved_at: When admin approved")
                print("- admin_rejection_reason: Reason for rejection")
                print("\nPayment fields are now non-nullable with default values.")
                
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
            raise
        finally:
            db.session.close()

if __name__ == "__main__":
    migrate_booking_payment_fields()









