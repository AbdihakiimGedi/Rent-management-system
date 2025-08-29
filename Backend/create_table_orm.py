#!/usr/bin/env python3
"""
Alternative script to create the owner_requirements table using SQLAlchemy ORM
"""

from app import create_app
from app.extensions import db
from app.models.owner_requirement import OwnerRequirement

def create_table_using_orm():
    """Create the owner_requirements table using SQLAlchemy ORM"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Creating owner_requirements table using ORM...")
            
            # This will create the table based on the model definition
            db.create_all()
            print("✅ Table created successfully using ORM")
            
            # Verify the table exists
            print("🔍 Verifying table creation...")
            try:
                # Try to query the table
                count = OwnerRequirement.query.count()
                print(f"✅ Table verification successful - {count} records found")
                
                # Show table structure
                print("📋 Table structure:")
                with db.engine.connect() as conn:
                    result = conn.execute(db.text('DESCRIBE owner_requirements'))
                    columns = [row for row in result]
                    for col in columns:
                        print(f"  {col[0]} - {col[1]}")
                        
            except Exception as verify_error:
                print(f"❌ Table verification failed: {verify_error}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating table: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("🚀 Setting up Owner Requirements Database Table (ORM Method)")
    print("=" * 60)
    
    if create_table_using_orm():
        print("\n✅ Setup completed successfully!")
        print("🎯 You can now:")
        print("  1. Restart your Flask server")
        print("  2. Visit /admin/owner-requirements")
        print("  3. Start creating requirement fields")
    else:
        print("\n❌ Setup failed. Please check the errors above.")



