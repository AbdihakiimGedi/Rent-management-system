"""Add missing columns to rental_items table

Revision ID: add_missing_rental_item_columns
Revises: 49353a1dbbd6
Create Date: 2025-08-18 12:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_missing_rental_item_columns'
down_revision = '49353a1dbbd6'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to rental_items table
    op.add_column('rental_items', sa.Column('name', sa.String(150), nullable=True))
    op.add_column('rental_items', sa.Column('description', sa.String(255), nullable=True))
    op.add_column('rental_items', sa.Column('dynamic_data', sa.Text, nullable=True))
    
    # Update existing records to have default values
    op.execute("UPDATE rental_items SET name = 'Unnamed Item' WHERE name IS NULL")
    op.execute("UPDATE rental_items SET description = '' WHERE description IS NULL")
    op.execute("UPDATE rental_items SET dynamic_data = '{}' WHERE dynamic_data IS NULL")
    
    # Make columns non-nullable after setting default values
    op.alter_column('rental_items', 'name', nullable=False)
    op.alter_column('rental_items', 'dynamic_data', nullable=False)


def downgrade():
    # Remove the added columns
    op.drop_column('rental_items', 'dynamic_data')
    op.drop_column('rental_items', 'description')
    op.drop_column('rental_items', 'name')





