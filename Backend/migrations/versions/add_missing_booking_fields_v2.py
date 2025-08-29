"""Add missing fields to bookings table

Revision ID: add_missing_booking_fields_v2
Revises: eec9c6f84e4f
Create Date: 2025-08-21 02:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_missing_booking_fields_v2'
down_revision = 'eec9c6f84e4f'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing fields to bookings table (contract_accepted already exists from eec9c6f84e4f)
    op.add_column('bookings', sa.Column('requirements_data', sa.Text(), nullable=True))
    op.add_column('bookings', sa.Column('service_fee', sa.Numeric(10, 2), nullable=True))
    op.add_column('bookings', sa.Column('payment_account', sa.String(100), nullable=True))
    op.add_column('bookings', sa.Column('delivered_at', sa.DateTime(), nullable=True))
    op.add_column('bookings', sa.Column('renter_confirmed', sa.Boolean(), nullable=True, default=False))
    op.add_column('bookings', sa.Column('owner_confirmed', sa.Boolean(), nullable=True, default=False))
    op.add_column('bookings', sa.Column('penalty_applied', sa.Boolean(), nullable=True, default=False))
    op.add_column('bookings', sa.Column('owner_rating_penalty', sa.Integer(), nullable=True, default=0))
    
    # Set default values for existing records
    op.execute("UPDATE bookings SET renter_confirmed = false WHERE renter_confirmed IS NULL")
    op.execute("UPDATE bookings SET owner_confirmed = false WHERE owner_confirmed IS NULL")
    op.execute("UPDATE bookings SET penalty_applied = false WHERE penalty_applied IS NULL")
    op.execute("UPDATE bookings SET owner_rating_penalty = 0 WHERE owner_rating_penalty IS NULL")
    op.execute("UPDATE bookings SET service_fee = 0 WHERE service_fee IS NULL")


def downgrade():
    # Remove added columns
    op.drop_column('bookings', 'owner_rating_penalty')
    op.drop_column('bookings', 'penalty_applied')
    op.drop_column('bookings', 'owner_confirmed')
    op.drop_column('bookings', 'renter_confirmed')
    op.drop_column('bookings', 'delivered_at')
    op.drop_column('bookings', 'payment_account')
    op.drop_column('bookings', 'service_fee')
    op.drop_column('bookings', 'requirements_data')
