#!/usr/bin/env python3
"""
Email Helper Functions for RentSystem
Handles email sending with configuration checks
"""

from flask import current_app
from flask_mail import Message
from app.extensions import mail
import logging

def is_email_enabled():
    """Check if email sending is enabled in configuration"""
    return current_app.config.get('MAIL_ENABLED', False)

def send_email_safe(recipients, subject, body, html_body=None):
    """
    Send email safely with configuration checks
    
    Args:
        recipients: List of email addresses or single email address
        subject: Email subject
        body: Plain text body
        html_body: Optional HTML body
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not is_email_enabled():
        print(f"[EMAIL] Email disabled in config - would have sent: {subject} to {recipients}")
        return True  # Return True so the application continues normally
    
    try:
        # Ensure recipients is a list
        if isinstance(recipients, str):
            recipients = [recipients]
        
        # Create message
        msg = Message(
            subject=subject,
            recipients=recipients,
            body=body,
            html=html_body
        )
        
        # Send email
        mail.send(msg)
        print(f"[EMAIL] ✅ Email sent successfully: {subject} to {recipients}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] ❌ Failed to send email: {subject} to {recipients}")
        print(f"[EMAIL] Error: {e}")
        return False

def send_booking_acceptance_emails(booking, confirmation_code):
    """Send booking acceptance emails to both user and owner"""
    from app.models.RentalItem import RentalItem
    
    rental_item = RentalItem.query.get(booking.rental_item_id)
    item_name = rental_item.get_dynamic_data().get('Item Name', 'Rental Item') if rental_item else 'Rental Item'
    
    # Send to user
    user_success = send_email_safe(
        recipients=[booking.renter.email],
        subject="Your Rental Booking Has Been Accepted!",
        body=f"""
        Great news! Your booking for {item_name} has been accepted by the owner.
        
        To complete your rental, please enter this 6-digit confirmation code:
        **{confirmation_code}**
        
        This code expires in 24 hours. Both you and the owner must confirm with this code to complete the delivery.
        
        If you don't confirm within 24 hours, the owner may complete the delivery without your confirmation.
        """
    )
    
    # Send to owner
    owner_success = send_email_safe(
        recipients=[rental_item.owner.email if rental_item else ""],
        subject="Booking Accepted - Confirmation Code Generated",
        body=f"""
        You have accepted the booking for {item_name}.
        
        The 6-digit confirmation code is: **{confirmation_code}**
        
        Both you and the renter must confirm with this code to complete the delivery.
        If the renter doesn't confirm within 24 hours, you can complete the delivery alone.
        
        The code expires in 24 hours.
        """
    )
    
    return user_success and owner_success

def send_delivery_completion_emails(booking):
    """Send delivery completion emails to both parties"""
    from app.models.RentalItem import RentalItem
    
    rental_item = RentalItem.query.get(booking.rental_item_id)
    item_name = rental_item.get_dynamic_data().get('Item Name', 'Rental Item') if rental_item else 'Rental Item'
    
    # Send to user
    user_success = send_email_safe(
        recipients=[booking.renter.email],
        subject="Rental Delivery Completed!",
        body=f"""
        Congratulations! Your rental delivery for {item_name} has been completed.
        
        Both you and the owner have confirmed the delivery. Your payment has been released to the owner.
        """
    )
    
    # Send to owner
    owner_success = send_email_safe(
        recipients=[rental_item.owner.email if rental_item else ""],
        subject="Rental Delivery Completed - Payment Released",
        body=f"""
        Great! The rental delivery for {item_name} has been completed.
        
        Both parties have confirmed. Your payment of ${booking.payment_amount} has been released (minus service fee).
        """
    )
    
    return user_success and owner_success

def send_booking_rejection_email(booking, rejection_reason="Owner declined"):
    """Send booking rejection email to user"""
    from app.models.RentalItem import RentalItem
    
    rental_item = RentalItem.query.get(booking.rental_item_id)
    item_name = rental_item.get_dynamic_data().get('Item Name', 'Rental Item') if rental_item else 'Rental Item'
    
    return send_email_safe(
        recipients=[booking.renter.email],
        subject="Booking Rejected - Refund Processed",
        body=f"""
        We're sorry to inform you that your booking for {item_name} has been rejected by the owner.
        
        Reason: {rejection_reason}
        
        Your payment has been automatically refunded to your original payment method (minus service fee).
        The refund should appear in your account within 3-5 business days.
        
        Thank you for using RentSystem!
        """
    )








