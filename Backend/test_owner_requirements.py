#!/usr/bin/env python3
"""
Test script to verify owner requirements database functionality
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.extensions import db
from app.models.owner_requirement import OwnerRequirement
from app import create_app

def test_database_connection():
    """Test if we can connect to the database and access the owner_requirements table"""
    app = create_app()
    
    with app.app_context():
        try:
            # Test basic database connection
            print("Testing database connection...")
            db.engine.execute("SELECT 1")
            print("✅ Database connection successful")
            
            # Test if owner_requirements table exists
            print("Testing owner_requirements table...")
            try:
                # Try to query the table
                count = OwnerRequirement.query.count()
                print(f"✅ Owner requirements table exists with {count} records")
                
                # Test creating a sample record
                print("Testing record creation...")
                sample_requirement = OwnerRequirement(
                    label="Test Business Plan",
                    field_name="test_business_plan",
                    input_type="textarea",
                    is_required=True,
                    placeholder="Enter your business plan",
                    help_text="This is a test requirement",
                    order_index=0,
                    is_active=True
                )
                
                db.session.add(sample_requirement)
                db.session.commit()
                print("✅ Sample record created successfully")
                
                # Clean up test record
                db.session.delete(sample_requirement)
                db.session.commit()
                print("✅ Test record cleaned up")
                
            except Exception as table_error:
                print(f"❌ Table error: {table_error}")
                if "no such table" in str(table_error).lower():
                    print("💡 The owner_requirements table doesn't exist yet.")
                    print("💡 Please run: alembic upgrade head")
                return False
                
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    return True

def check_migration_status():
    """Check the current migration status"""
    print("\nChecking migration status...")
    try:
        from alembic import command
        from alembic.config import Config
        
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("script_location", "migrations")
        
        # Get current revision
        from alembic.script import ScriptDirectory
        script = ScriptDirectory.from_config(alembic_cfg)
        heads = script.get_heads()
        
        print(f"Available migration heads: {heads}")
        
        # Check if our migration is in the list
        if "add_owner_requirements_table" in str(heads):
            print("✅ Owner requirements migration is available")
        else:
            print("❌ Owner requirements migration not found")
            
    except Exception as e:
        print(f"❌ Error checking migration status: {e}")

if __name__ == "__main__":
    print("🔍 Testing Owner Requirements Database Setup")
    print("=" * 50)
    
    check_migration_status()
    
    if test_database_connection():
        print("\n✅ All tests passed! Database is ready.")
    else:
        print("\n❌ Tests failed. Please check the errors above.")
        print("\n💡 Common solutions:")
        print("1. Run: alembic upgrade head")
        print("2. Check database connection settings")
        print("3. Verify the migration file exists")



