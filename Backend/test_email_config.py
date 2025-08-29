#!/usr/bin/env python3
"""
Email Configuration Test Script
This script helps test the Gmail SMTP configuration
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_gmail_smtp():
    """Test Gmail SMTP connection"""
    
    # Email configuration
    sender_email = "cabdixakiincuumar43@gmail.com"
    sender_password = input("Enter your Gmail App Password: ")  # Will prompt for password
    
    # Test recipient (you can change this)
    recipient_email = "cabdixakiincuumar43@gmail.com"
    
    # Create message
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = "Test Email from RentSystem"
    
    # Email body
    body = """
    This is a test email from your RentSystem application.
    
    If you receive this email, your Gmail SMTP configuration is working correctly!
    
    Best regards,
    RentSystem Team
    """
    
    message.attach(MIMEText(body, "plain"))
    
    try:
        # Create SMTP session
        print("🔄 Connecting to Gmail SMTP...")
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        
        print("🔄 Authenticating...")
        server.login(sender_email, sender_password)
        
        print("🔄 Sending test email...")
        text = message.as_string()
        server.sendmail(sender_email, recipient_email, text)
        
        print("✅ Test email sent successfully!")
        print(f"📧 Email sent to: {recipient_email}")
        
    except smtplib.SMTPAuthenticationError as e:
        print("❌ Authentication failed!")
        print("Error:", str(e))
        print("\n🔧 To fix this:")
        print("1. Go to your Google Account settings")
        print("2. Enable 2-Step Verification")
        print("3. Generate an App Password")
        print("4. Use the App Password instead of your regular password")
        
    except Exception as e:
        print("❌ Error occurred:")
        print("Error:", str(e))
        
    finally:
        if 'server' in locals():
            server.quit()
            print("🔄 SMTP connection closed")

def setup_instructions():
    """Show setup instructions"""
    print("\n" + "="*60)
    print("📧 GMAIL SMTP SETUP INSTRUCTIONS")
    print("="*60)
    print("\n1. 🔐 Enable 2-Step Verification:")
    print("   - Go to: https://myaccount.google.com/security")
    print("   - Click '2-Step Verification' and enable it")
    
    print("\n2. 🔑 Generate App Password:")
    print("   - Go to: https://myaccount.google.com/apppasswords")
    print("   - Select 'Mail' and 'Other (Custom name)'")
    print("   - Name it 'RentSystem'")
    print("   - Copy the 16-character password")
    
    print("\n3. 📝 Set Environment Variables:")
    print("   - Create a .env file in your Backend folder")
    print("   - Add: MAIL_PASSWORD=your_16_char_app_password")
    
    print("\n4. 🧪 Test Configuration:")
    print("   - Run: python test_email_config.py")
    print("   - Enter your App Password when prompted")
    
    print("\n5. ✅ Success:")
    print("   - If test email sends successfully, your config is working!")
    print("="*60)

if __name__ == "__main__":
    print("🧪 RentSystem Email Configuration Test")
    print("="*40)
    
    setup_instructions()
    
    print("\n🔄 Ready to test email configuration...")
    response = input("Do you want to test the email configuration now? (y/n): ")
    
    if response.lower() in ['y', 'yes']:
        test_gmail_smtp()
    else:
        print("📝 Run this script later when you're ready to test.")








