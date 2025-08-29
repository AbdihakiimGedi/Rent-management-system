#!/usr/bin/env python3
"""
Debug script to check why admin dashboard revenue is showing $0
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.booking import Booking
from app.models.user import User
from app.models.RentalItem import RentalItem

def debug_revenue():
    """Debug the revenue calculation issue"""
    app = create_app()
    
    with app.app_context():
        print("🔍 DEBUGGING REVENUE CALCULATION")
        print("=" * 50)
        
        # Check if we can connect to database
        try:
            with db.engine.connect() as conn:
                conn.execute(db.text("SELECT 1"))
            print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return
        
        # Check total bookings
        total_bookings = Booking.query.count()
        print(f"📊 Total bookings in database: {total_bookings}")
        
        if total_bookings == 0:
            print("⚠️  No bookings found - this explains $0 revenue")
            return
        
        # Check all bookings and their statuses
        print("\n📋 ALL BOOKINGS STATUS:")
        print("-" * 30)
        bookings = Booking.query.all()
        
        for booking in bookings:
            print(f"Booking #{booking.id}:")
            print(f"  - Status: {getattr(booking, 'status', 'N/A')}")
            print(f"  - Payment Status: {getattr(booking, 'payment_status', 'N/A')}")
            print(f"  - Payment Amount: ${getattr(booking, 'payment_amount', 'N/A')}")
            print(f"  - Service Fee: ${getattr(booking, 'service_fee', 'N/A')}")
            print(f"  - Payment Held At: {getattr(booking, 'payment_held_at', 'N/A')}")
            print(f"  - Payment Released At: {getattr(booking, 'payment_released_at', 'N/A')}")
            print(f"  - Admin Approved: {getattr(booking, 'admin_approved', 'N/A')}")
            print()
        
        # Check for confirmed bookings specifically
        print("🔍 CHECKING FOR CONFIRMED BOOKINGS:")
        print("-" * 30)
        
        confirmed_bookings = Booking.query.filter(
            db.and_(
                Booking.payment_status == 'COMPLETED',
                Booking.status == 'Confirmed'
            )
        ).all()
        
        print(f"✅ Confirmed bookings found: {len(confirmed_bookings)}")
        
        if confirmed_bookings:
            total_payment_amounts = 0
            total_service_fees = 0
            
            for booking in confirmed_bookings:
                payment_amount = float(booking.payment_amount or 0)
                service_fee = float(booking.service_fee or 0)
                
                total_payment_amounts += payment_amount
                total_service_fees += service_fee
                
                print(f"  Booking #{booking.id}:")
                print(f"    - Payment: ${payment_amount}")
                print(f"    - Service Fee: ${service_fee}")
                print(f"    - Total: ${payment_amount + service_fee}")
            
            print(f"\n💰 TOTAL REVENUE BREAKDOWN:")
            print(f"  - Payment amounts to owners: ${total_payment_amounts}")
            print(f"  - Service fees to admin: ${total_service_fees}")
            print(f"  - Admin revenue should be: ${total_service_fees}")
        else:
            print("❌ No confirmed bookings found!")
            print("   This means no revenue can be calculated yet.")
        
        # Check for HELD payments
        print("\n🔒 CHECKING FOR HELD PAYMENTS:")
        print("-" * 30)
        
        held_bookings = Booking.query.filter(
            db.and_(
                Booking.payment_status == 'HELD',
                Booking.status == 'Payment_Held'
            )
        ).all()
        
        print(f"🔒 Held payments found: {len(held_bookings)}")
        
        if held_bookings:
            pending_revenue = 0
            pending_service_fees = 0
            
            for booking in held_bookings:
                payment_amount = float(booking.payment_amount or 0)
                service_fee = float(booking.service_fee or 0)
                
                pending_revenue += payment_amount + service_fee
                pending_service_fees += service_fee
                
                print(f"  Booking #{booking.id}:")
                print(f"    - Payment: ${payment_amount}")
                print(f"    - Service Fee: ${service_fee}")
                print(f"    - Total Held: ${payment_amount + service_fee}")
            
            print(f"\n⏳ PENDING REVENUE:")
            print(f"  - Total pending: ${pending_revenue}")
            print(f"  - Pending service fees: ${pending_service_fees}")
        
        # Check database schema
        print("\n🗄️  DATABASE SCHEMA CHECK:")
        print("-" * 30)
        
        try:
            # Check if service_fee column exists
            with db.engine.connect() as conn:
                result = conn.execute(db.text("""
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'bookings' 
                    AND COLUMN_NAME IN ('service_fee', 'payment_status', 'status')
                    ORDER BY COLUMN_NAME
                """))
                
                columns = result.fetchall()
                for col in columns:
                    print(f"  {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
                
        except Exception as e:
            print(f"❌ Could not check schema: {e}")
        
        print("\n" + "=" * 50)
        print("🔍 REVENUE DEBUG COMPLETE")

if __name__ == "__main__":
    debug_revenue()
