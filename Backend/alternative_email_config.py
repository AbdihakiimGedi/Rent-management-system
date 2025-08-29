#!/usr/bin/env python3
"""
Alternative Email Configuration for RentSystem
Using multiple email service providers as backup
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailService:
    """Email service with multiple provider support"""
    
    def __init__(self):
        self.providers = {
            'gmail': {
                'smtp_server': 'smtp.gmail.com',
                'port': 587,
                'use_tls': True
            },
            'outlook': {
                'smtp_server': 'smtp-mail.outlook.com',
                'port': 587,
                'use_tls': True
            },
            'yahoo': {
                'smtp_server': 'smtp.mail.yahoo.com',
                'port': 587,
                'use_tls': True
            }
        }
    
    def test_email_provider(self, provider, email, password):
        """Test a specific email provider"""
        print(f"🧪 Testing {provider.upper()} email service...")
        
        if provider not in self.providers:
            print(f"❌ Provider {provider} not supported")
            return False
        
        config = self.providers[provider]
        
        try:
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            print(f"🌐 SMTP: {config['smtp_server']}:{config['port']}")
            
            # Create SMTP connection
            print("\n1️⃣ Creating SMTP connection...")
            server = smtplib.SMTP(config['smtp_server'], config['port'])
            print("✅ SMTP connection created")
            
            # Start TLS if required
            if config['use_tls']:
                print("2️⃣ Starting TLS...")
                server.starttls()
                print("✅ TLS started")
            
            # Login
            print("3️⃣ Attempting login...")
            server.login(email, password)
            print("✅ LOGIN SUCCESSFUL!")
            
            # Close connection
            server.quit()
            print(f"🎉 SUCCESS! {provider.upper()} email is working!")
            return True
            
        except Exception as e:
            print(f"❌ {provider.upper()} failed: {e}")
            return False
    
    def send_test_email(self, provider, email, password, to_email, subject="Test Email"):
        """Send a test email using the specified provider"""
        if provider not in self.providers:
            return False
        
        config = self.providers[provider]
        
        try:
            # Create message
            message = MIMEMultipart()
            message["From"] = email
            message["To"] = to_email
            message["Subject"] = subject
            
            body = f"""
            🎉 SUCCESS! Your {provider.upper()} email configuration is working!
            
            This test email confirms that:
            ✅ SMTP connection is successful
            ✅ Authentication is working
            ✅ Email sending is functional
            
            Your RentSystem booking confirmations will work perfectly!
            
            Best regards,
            RentSystem Team
            """
            
            message.attach(MIMEText(body, "plain"))
            
            # Send email
            server = smtplib.SMTP(config['smtp_server'], config['port'])
            if config['use_tls']:
                server.starttls()
            server.login(email, password)
            
            text = message.as_string()
            server.sendmail(email, to_email, text)
            server.quit()
            
            print(f"📧 Test email sent successfully via {provider.upper()}!")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send test email via {provider}: {e}")
            return False

if __name__ == "__main__":
    email_service = EmailService()
    
    # Test Gmail with current credentials
    gmail_email = "cabdixaiincumar43@gmail.com"
    gmail_password = "bncmrkpxfatcpyxp"
    
    print("🔍 Testing Email Providers...")
    print("=" * 50)
    
    # Test Gmail
    gmail_success = email_service.test_email_provider('gmail', gmail_email, gmail_password)
    
    if gmail_success:
        print("\n🚀 Gmail is working! Sending test email...")
        email_service.send_test_email('gmail', gmail_email, gmail_password, gmail_email)
    else:
        print("\n⚠️  Gmail authentication failed")
        print("📋 Next steps:")
        print("1. Try generating a new App Password")
        print("2. Use a different email provider (Outlook/Yahoo)")
        print("3. Contact Gmail support for account issues")








