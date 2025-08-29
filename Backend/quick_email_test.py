#!/usr/bin/env python3
"""
Quick Email Test with Correct Credentials
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_email():
    """Test email with correct credentials"""
    
    # Correct credentials (no spaces in App Password)
    sender_email = "cabdixaiincumar43@gmail.com"
    app_password = "bncmrkpxfatcpyxp"  # No spaces!
    recipient_email = "cabdixaiincumar43@gmail.com"
    
    print("🧪 Testing email configuration...")
    print(f"📧 From: {sender_email}")
    print(f"🔑 App Password: {app_password}")
    print(f"📬 To: {recipient_email}")
    
    # Create message
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = "🎉 RentSystem Email Test - SUCCESS!"
    
    body = """
    🎉 SUCCESS! Your RentSystem email configuration is working!
    
    This means:
    ✅ Gmail SMTP is properly configured
    ✅ App Password is correct
    ✅ Email sending will work for booking confirmations
    
    Best regards,
    RentSystem Team
    """
    
    message.attach(MIMEText(body, "plain"))
    
    try:
        print("\n🔄 Connecting to Gmail SMTP...")
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        
        print("🔄 Authenticating...")
        server.login(sender_email, app_password)
        
        print("🔄 Sending test email...")
        text = message.as_string()
        server.sendmail(sender_email, recipient_email, text)
        
        print("✅ SUCCESS! Test email sent successfully!")
        print(f"📧 Email sent to: {recipient_email}")
        print("🔐 Your email configuration is working perfectly!")
        
    except smtplib.SMTPAuthenticationError as e:
        print("❌ Authentication failed!")
        print("Error:", str(e))
        print("\n🔧 Check your App Password:")
        print("1. Make sure it has NO spaces")
        print("2. It should be exactly 16 characters")
        print("3. Current password: bncmrkpxfatcpyxp")
        
    except Exception as e:
        print("❌ Error occurred:")
        print("Error:", str(e))
        
    finally:
        if 'server' in locals():
            server.quit()
            print("🔄 SMTP connection closed")

if __name__ == "__main__":
    test_email()
