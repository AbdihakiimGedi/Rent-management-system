"""
Simple email utility for sending notifications
"""

def send_email(to_email, subject, body):
    """
    Simple email sending function
    In production, you would use a proper email service like SendGrid, AWS SES, etc.
    """
    try:
        # For now, just print the email details
        print(f"📧 EMAIL SENT:")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Body: {body}")
        print(f"   Status: Success (printed to console)")
        
        # In production, you would implement actual email sending here:
        # from flask_mail import Message
        # msg = Message(subject, recipients=[to_email], html=body)
        # mail.send(msg)
        
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False





