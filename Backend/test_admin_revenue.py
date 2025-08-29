#!/usr/bin/env python3
"""
Test script to directly test the admin revenue calculation logic
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.booking import Booking

def test_revenue_calculation():
    """Test the exact revenue calculation logic used in admin dashboard"""
    app = create_app()
    
    with app.app_context():
        print("🧪 TESTING ADMIN REVENUE CALCULATION")
        print("=" * 50)
        
        # Test the EXACT logic from admin dashboard
        try:
            print("1️⃣ Testing the exact query from admin dashboard:")
            print("-" * 40)
            
            # Get payment amounts from confirmed bookings
            total_payment_amounts = db.session.query(db.func.sum(Booking.payment_amount)).filter(
                db.and_(
                    Booking.payment_status == 'COMPLETED',
                    Booking.status == 'Confirmed'
                )
            ).scalar()
            
            print(f"   Total payment amounts query result: {total_payment_amounts}")
            
            # Get total service fees from confirmed bookings
            total_service_fees = db.session.query(db.func.sum(Booking.service_fee)).filter(
                db.and_(
                    Booking.payment_status == 'COMPLETED',
                    Booking.status == 'Confirmed'
                )
            ).scalar()
            
            print(f"   Total service fees query result: {total_service_fees}")
            
            # Calculate admin revenue (service fees only)
            total_revenue = float(total_service_fees) if total_service_fees else 0
            
            print(f"   Calculated admin revenue: ${total_revenue}")
            
            # Test with explicit values
            print("\n2️⃣ Testing with explicit values:")
            print("-" * 40)
            
            confirmed_bookings = Booking.query.filter(
                db.and_(
                    Booking.payment_status == 'COMPLETED',
                    Booking.status == 'Confirmed'
                )
            ).all()
            
            print(f"   Found {len(confirmed_bookings)} confirmed bookings")
            
            manual_total = 0
            for booking in confirmed_bookings:
                service_fee = float(booking.service_fee or 0)
                manual_total += service_fee
                print(f"   Booking #{booking.id}: service_fee = ${service_fee}")
            
            print(f"   Manual calculation total: ${manual_total}")
            
            # Test the sum function directly
            print("\n3️⃣ Testing sum function directly:")
            print("-" * 40)
            
            # Try different approaches
            try:
                # Approach 1: Direct sum
                direct_sum = db.session.query(db.func.sum(Booking.service_fee)).filter(
                    Booking.payment_status == 'COMPLETED'
                ).scalar()
                print(f"   Direct sum (payment_status only): {direct_sum}")
                
                # Approach 2: With status filter
                status_sum = db.session.query(db.func.sum(Booking.service_fee)).filter(
                    Booking.status == 'Confirmed'
                ).scalar()
                print(f"   Status sum (status only): {status_sum}")
                
                # Approach 3: Combined filter
                combined_sum = db.session.query(db.func.sum(Booking.service_fee)).filter(
                    db.and_(
                        Booking.payment_status == 'COMPLETED',
                        Booking.status == 'Confirmed'
                    )
                ).scalar()
                print(f"   Combined sum: {combined_sum}")
                
                # Approach 4: Raw SQL
                with db.engine.connect() as conn:
                    raw_result = conn.execute(db.text("""
                        SELECT SUM(service_fee) as total_service_fees
                        FROM bookings 
                        WHERE payment_status = 'COMPLETED' 
                        AND status = 'Confirmed'
                    """)).fetchone()
                    raw_sum = raw_result[0] if raw_result and raw_result[0] else 0
                    print(f"   Raw SQL sum: {raw_sum}")
                
            except Exception as e:
                print(f"   Error in sum approaches: {e}")
            
            print("\n" + "=" * 50)
            print("🧪 REVENUE TEST COMPLETE")
            
        except Exception as e:
            print(f"❌ Error in revenue calculation: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_revenue_calculation()









