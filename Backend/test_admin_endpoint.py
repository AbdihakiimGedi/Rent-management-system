#!/usr/bin/env python3
"""
Test script to call the admin dashboard endpoint directly
"""

import requests
import json

def test_admin_dashboard():
    """Test the admin dashboard endpoint directly"""
    print("🌐 TESTING ADMIN DASHBOARD ENDPOINT")
    print("=" * 50)
    
    # Test the stats endpoint
    try:
        print("1️⃣ Testing /admin/dashboard/stats endpoint:")
        print("-" * 40)
        
        # You'll need to get a valid admin token first
        # For now, let's just test the endpoint structure
        
        response = requests.get("http://127.0.0.1:5000/admin/dashboard/stats")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            # Check revenue specifically
            revenue = data.get('revenue', 0)
            print(f"   Revenue from response: ${revenue}")
            
        elif response.status_code == 401:
            print("   ❌ Unauthorized - need admin token")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
    
    print("\n2️⃣ Testing /admin/dashboard/revenue endpoint:")
    print("-" * 40)
    
    try:
        response = requests.get("http://127.0.0.1:5000/admin/dashboard/revenue")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            # Check admin revenue specifically
            admin_revenue = data.get('summary', {}).get('admin_total_revenue', 0)
            print(f"   Admin revenue from response: ${admin_revenue}")
            
        elif response.status_code == 401:
            print("   ❌ Unauthorized - need admin token")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
    
    print("\n" + "=" * 50)
    print("🌐 ENDPOINT TEST COMPLETE")
    print("\n💡 Note: If you get 401 errors, you need to:")
    print("   1. Login as admin user")
    print("   2. Get the JWT token")
    print("   3. Include it in Authorization header")

if __name__ == "__main__":
    test_admin_dashboard()









