#!/usr/bin/env python3
"""
Test script to verify owner endpoints are working correctly.
This will help debug the authentication and data fetching issues.
"""

import requests
import json

# Test configuration
BASE_URL = "http://127.0.0.1:5000"
TEST_USERNAME = "saabir"  # Use the owner username from your logs
TEST_PASSWORD = "123"     # Use the password for this user

def test_owner_endpoints():
    """Test the owner endpoints to verify they're working"""
    
    print("🧪 Testing Owner Endpoints")
    print("=" * 50)
    
    # Step 1: Test login
    print("\n1️⃣ Testing login...")
    login_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print(f"Login successful: {login_result.get('message', 'No message')}")
            
            # Extract token and user data
            token = login_result.get('token')
            user = login_result.get('user')
            
            if token and user:
                print(f"Token received: {'Yes' if token else 'No'}")
                print(f"User data: {user.get('username')} ({user.get('role')})")
                
                # Step 2: Test owner endpoints with token
                headers = {"Authorization": f"Bearer {token}"}
                
                print("\n2️⃣ Testing owner endpoints...")
                
                # Test categories endpoint
                print("\n   Testing /owner/categories...")
                categories_response = requests.get(f"{BASE_URL}/owner/categories", headers=headers)
                print(f"   Categories status: {categories_response.status_code}")
                if categories_response.status_code == 200:
                    categories_data = categories_response.json()
                    print(f"   Categories count: {len(categories_data.get('categories', []))}")
                else:
                    print(f"   Categories error: {categories_response.text}")
                
                # Test rental items endpoint
                print("\n   Testing /owner/rental-items...")
                items_response = requests.get(f"{BASE_URL}/owner/rental-items", headers=headers)
                print(f"   Items status: {items_response.status_code}")
                if items_response.status_code == 200:
                    items_data = items_response.json()
                    print(f"   Items count: {len(items_data.get('rental_items', []))}")
                else:
                    print(f"   Items error: {items_response.text}")
                
                # Test bookings endpoint
                print("\n   Testing /owner/bookings...")
                bookings_response = requests.get(f"{BASE_URL}/owner/bookings", headers=headers)
                print(f"   Bookings status: {bookings_response.status_code}")
                if bookings_response.status_code == 200:
                    bookings_data = bookings_response.json()
                    print(f"   Bookings count: {len(bookings_data.get('bookings', []))}")
                else:
                    print(f"   Bookings error: {bookings_response.text}")
                
                # Step 3: Test without token (should fail)
                print("\n3️⃣ Testing without token (should fail)...")
                no_token_response = requests.get(f"{BASE_URL}/owner/categories")
                print(f"   No token status: {no_token_response.status_code}")
                
            else:
                print("❌ No token or user data received")
                
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Backend server is not running")
        print("   Please start the Flask backend server first")
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    print("🚀 Owner Endpoints Test Script")
    print("Make sure your Flask backend is running on http://127.0.0.1:5000")
    print()
    
    test_owner_endpoints()
    
    print("\n" + "=" * 50)
    print("🏁 Testing complete!")









