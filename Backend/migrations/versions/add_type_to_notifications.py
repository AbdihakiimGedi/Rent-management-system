"""Add type column to notifications table

Revision ID: add_type_to_notifications
Revises: add_missing_booking_fields_v2
Create Date: 2025-08-22 03:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_type_to_notifications'
down_revision = 'add_missing_booking_fields_v2'
branch_labels = None
depends_on = None


def upgrade():
    # Add type column to notifications table
    op.add_column('notifications', sa.Column('type', sa.String(50), nullable=True))


def downgrade():
    # Remove type column from notifications table
    op.drop_column('notifications', 'type')








