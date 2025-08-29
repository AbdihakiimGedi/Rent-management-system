"""Add owner requirements table

Revision ID: add_owner_requirements_table
Revises: 566ac60ef60a
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_owner_requirements_table'
down_revision = '566ac60ef60a'
branch_labels = None
depends_on = None


def upgrade():
    # Create owner_requirements table
    op.create_table('owner_requirements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('field_name', sa.String(length=255), nullable=False),
        sa.Column('input_type', sa.String(length=50), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=True),
        sa.Column('placeholder', sa.String(length=255), nullable=True),
        sa.Column('help_text', sa.Text(), nullable=True),
        sa.Column('options', sa.Text(), nullable=True),
        sa.Column('validation_rules', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('field_name')
    )
    
    # Add indexes for better performance
    op.create_index(op.f('ix_owner_requirements_is_active'), 'owner_requirements', ['is_active'], unique=False)
    op.create_index(op.f('ix_owner_requirements_order_index'), 'owner_requirements', ['order_index'], unique=False)
    op.create_index(op.f('ix_owner_requirements_input_type'), 'owner_requirements', ['input_type'], unique=False)


def downgrade():
    # Remove indexes
    op.drop_index(op.f('ix_owner_requirements_input_type'), table_name='owner_requirements')
    op.drop_index(op.f('ix_owner_requirements_order_index'), table_name='owner_requirements')
    op.drop_index(op.f('ix_owner_requirements_is_active'), table_name='owner_requirements')
    
    # Drop table
    op.drop_table('owner_requirements')



