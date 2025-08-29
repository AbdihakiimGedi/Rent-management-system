"""
Migration: Add dynamic_data column to rental_items table
Date: 2024-01-XX
Description: Add dynamic_data column to store owner-submitted category requirement values
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_dynamic_data_to_rental_items'
down_revision = None  # Set this to your previous migration if you have one
branch_labels = None
depends_on = None

def upgrade():
    """Add dynamic_data column to rental_items table"""
    
    # Add dynamic_data column to store JSON data
    op.add_column('rental_items', 
        sa.Column('dynamic_data', sa.Text(), nullable=True, comment='JSON storage for owner-submitted category requirement values')
    )
    
    # Add updated_at column for tracking modifications
    op.add_column('rental_items',
        sa.Column('updated_at', sa.DateTime(), nullable=True, comment='Last update timestamp')
    )
    
    # Set default value for existing records
    op.execute("UPDATE rental_items SET updated_at = created_at WHERE updated_at IS NULL")
    
    # Make updated_at NOT NULL after setting default values
    op.alter_column('rental_items', 'updated_at', nullable=False)

def downgrade():
    """Remove dynamic_data column from rental_items table"""
    
    # Remove the columns we added
    op.drop_column('rental_items', 'dynamic_data')
    op.drop_column('rental_items', 'updated_at')




