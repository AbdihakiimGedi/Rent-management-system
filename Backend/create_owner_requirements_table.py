#!/usr/bin/env python3
"""
Script to create the owner_requirements table
"""

from app import create_app
from app.extensions import db

def create_owner_requirements_table():
    """Create the owner_requirements table if it doesn't exist"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🔧 Creating owner_requirements table...")
            
            # Create the owner_requirements table
            with db.engine.connect() as conn:
                conn.execute(db.text('''
                    CREATE TABLE IF NOT EXISTS owner_requirements (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        label VARCHAR(255) NOT NULL,
                        field_name VARCHAR(255) NOT NULL UNIQUE,
                        input_type VARCHAR(50) NOT NULL,
                        is_required BOOLEAN DEFAULT TRUE,
                        placeholder VARCHAR(255),
                        help_text TEXT,
                        options TEXT,
                        validation_rules TEXT,
                        order_index INT DEFAULT 0,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                '''))
                conn.commit()
            print("✅ owner_requirements table created successfully")
            
            # Add indexes for better performance
            print("🔧 Creating indexes...")
            with db.engine.connect() as conn:
                conn.execute(db.text('CREATE INDEX IF NOT EXISTS ix_owner_requirements_is_active ON owner_requirements(is_active)'))
                conn.execute(db.text('CREATE INDEX IF NOT EXISTS ix_owner_requirements_order_index ON owner_requirements(order_index)'))
                conn.execute(db.text('CREATE INDEX IF NOT EXISTS ix_owner_requirements_input_type ON owner_requirements(input_type)'))
                conn.commit()
            print("✅ Indexes created successfully")
            
            # Verify the table exists
            print("🔍 Verifying table creation...")
            with db.engine.connect() as conn:
                result = conn.execute(db.text('SHOW TABLES LIKE "owner_requirements"'))
                tables = [row[0] for row in result]
                
                if tables:
                    print("✅ Table verification successful")
                    print("📋 Table structure:")
                    result = conn.execute(db.text('DESCRIBE owner_requirements'))
                    columns = [row for row in result]
                    for col in columns:
                        print(f"  {col[0]} - {col[1]}")
                else:
                    print("❌ Table verification failed")
                
        except Exception as e:
            print(f"❌ Error creating table: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("🚀 Setting up Owner Requirements Database Table")
    print("=" * 50)
    
    if create_owner_requirements_table():
        print("\n✅ Setup completed successfully!")
        print("🎯 You can now:")
        print("  1. Restart your Flask server")
        print("  2. Visit /admin/owner-requirements")
        print("  3. Start creating requirement fields")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
