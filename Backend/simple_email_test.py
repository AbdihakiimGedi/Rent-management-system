#!/usr/bin/env python3
"""
Simple Email Test - Debug Gmail Authentication
"""

import smtplib
import ssl

def test_gmail_connection():
    """Test Gmail SMTP connection step by step"""
    
    email = "cabdixaiincumar43@gmail.com"
    password = "bncmrkpxfatcpyxp"
    
    print("🧪 Gmail SMTP Test - Step by Step")
    print(f"📧 Email: {email}")
    print(f"🔑 App Password: {password}")
    print(f"📏 Password Length: {len(password)}")
    
    try:
        # Step 1: Create SMTP connection
        print("\n1️⃣ Creating SMTP connection...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        print("✅ SMTP connection created")
        
        # Step 2: Start TLS
        print("\n2️⃣ Starting TLS...")
        server.starttls()
        print("✅ TLS started")
        
        # Step 3: Try to login
        print("\n3️⃣ Attempting login...")
        server.login(email, password)
        print("✅ LOGIN SUCCESSFUL!")
        
        # Step 4: Close connection
        server.quit()
        print("\n🎉 SUCCESS! Your email configuration is working!")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ AUTHENTICATION FAILED!")
        print(f"Error Code: {e.smtp_code}")
        print(f"Error Message: {e.smtp_error}")
        print("\n🔧 Possible Solutions:")
        print("1. Check if 2-Step Verification is enabled")
        print("2. Verify App Password was generated correctly")
        print("3. Make sure you selected 'Mail' app when generating")
        print("4. Try generating a new App Password")
        return False
        
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {type(e).__name__}")
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_gmail_connection()
    if success:
        print("\n🚀 Your email is ready for RentSystem!")
    else:
        print("\n⚠️  Email setup needs attention")
