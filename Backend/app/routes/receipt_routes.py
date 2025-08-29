from flask import Blueprint, request, jsonify, send_file
from app.utils.security import jwt_required
from app.extensions import db
from app.models.booking import Booking
from fpdf import FPDF
import io

receipt_bp = Blueprint("receipt", __name__, url_prefix="/receipt")

# ------------------- Generate & Download PDF Receipt -------------------
@receipt_bp.route("/<int:booking_id>", methods=["GET"])
@jwt_required
def download_receipt(booking_id):
    print(f"[RECEIPT] 🔍 Download request for booking {booking_id}")
    print(f"[RECEIPT] 🔍 Current user: {request.current_user.username} (ID: {request.current_user.id}, Role: {request.current_user.role})")
    
    booking = Booking.query.get(booking_id)
    if not booking:
        print(f"[RECEIPT] ❌ Booking {booking_id} not found")
        return jsonify({"error": "Booking not found"}), 404

    # Check if rental item exists
    if not booking.rental_item:
        print(f"[RECEIPT] ❌ Rental item not found for booking {booking_id}")
        return jsonify({"error": "Rental item not found for this booking"}), 500

    # Check if rental item has owner
    if not hasattr(booking.rental_item, 'owner') or not booking.rental_item.owner:
        print(f"[RECEIPT] ❌ Owner not found for rental item {booking.rental_item.id}")
        return jsonify({"error": "Owner not found for this rental item"}), 500

    print(f"[RECEIPT] 🔍 Booking found: renter_id={booking.renter_id}, owner_id={booking.rental_item.owner_id}")

    # Only renter, owner, or admin can access
    if request.current_user.id not in [booking.renter_id, booking.rental_item.owner_id] and request.current_user.role != "admin":
        print(f"[RECEIPT] ❌ Access denied for user {request.current_user.id}")
        return jsonify({"error": "Access denied"}), 403

    # Check if user has confirmed delivery (for renters)
    if request.current_user.id == booking.renter_id and not booking.renter_confirmed:
        print(f"[RECEIPT] ❌ User has not confirmed delivery yet")
        return jsonify({"error": "You must confirm delivery before downloading the receipt"}), 400

    print(f"[RECEIPT] ✅ Access granted, generating receipt...")

    # Get receipt data
    try:
        print(f"[RECEIPT] 🔍 Calling booking.generate_receipt()...")
        receipt_data = booking.generate_receipt()
        print(f"[RECEIPT] 🔍 Receipt data generated successfully")
        print(f"[RECEIPT] 🔍 Receipt data type: {type(receipt_data)}")
        print(f"[RECEIPT] 🔍 Receipt data keys: {list(receipt_data.keys()) if receipt_data else 'None'}")
        
        # Validate receipt data
        if not receipt_data:
            raise Exception("Receipt data is empty or None")
            
        required_fields = ['booking_id', 'renter', 'owner', 'rental_item', 'payment_amount']
        missing_fields = [field for field in required_fields if field not in receipt_data]
        if missing_fields:
            raise Exception(f"Missing required fields in receipt data: {missing_fields}")
            
    except Exception as e:
        print(f"[RECEIPT] ❌ Error generating receipt data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to generate receipt: {str(e)}"}), 500

    # Create PDF
    try:
        print(f"[RECEIPT] 🔍 Starting PDF creation...")
        pdf = FPDF()
        pdf.add_page()
        
        # Set page margins and dimensions
        pdf.set_margins(20, 20, 20)
        page_width = pdf.w - 40  # Available width after margins
        
        # Add company logo and header with enhanced styling
        pdf.set_font("Arial", "B", 28)
        pdf.set_text_color(59, 130, 246)  # Blue color for company name
        pdf.cell(0, 20, "RENT SYSTEM", ln=True, align="C")
        
        # Add tagline
        pdf.set_font("Arial", "I", 14)
        pdf.set_text_color(107, 114, 128)  # Gray color for tagline
        pdf.cell(0, 8, "Your Trusted Rental Platform", ln=True, align="C")
        pdf.ln(8)
        
        # Add receipt title with enhanced styling
        pdf.set_font("Arial", "B", 20)
        pdf.set_text_color(0, 0, 0)  # Black color for title
        pdf.cell(0, 12, "PAYMENT RECEIPT", ln=True, align="C")
        
        # Add decorative line
        pdf.set_draw_color(59, 130, 246)  # Blue line
        pdf.set_line_width(0.5)
        pdf.line(20, pdf.get_y(), page_width + 20, pdf.get_y())
        pdf.ln(10)
        
        # Receipt details section with enhanced styling
        pdf.set_font("Arial", "B", 16)
        pdf.set_text_color(59, 130, 246)  # Blue color for section headers
        pdf.cell(0, 10, "Receipt Information", ln=True)
        pdf.ln(5)
        
        # Create a styled box for receipt details
        pdf.set_fill_color(248, 250, 252)  # Light gray background
        pdf.rect(20, pdf.get_y(), page_width, 30, 'F')
        
        pdf.set_font("Arial", "B", 11)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(60, 7, "Receipt Number:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"#{receipt_data.get('booking_id', 'N/A')}", ln=True)
        
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Issue Date:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{receipt_data.get('created_at', 'N/A')}", ln=True)
        
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Status:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{receipt_data.get('status', 'N/A')}", ln=True)
        
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Contract Accepted:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{receipt_data.get('contract_accepted', 'N/A')}", ln=True)
        
        pdf.ln(10)
        
        # Customer Information section with enhanced styling
        pdf.set_font("Arial", "B", 16)
        pdf.set_text_color(59, 130, 246)  # Blue color for section headers
        pdf.cell(0, 10, "Customer Information", ln=True)
        pdf.ln(5)
        
        # Renter Information with styled box
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 8, "Renter Details:", ln=True)
        
        pdf.set_fill_color(239, 246, 255)  # Light blue background
        pdf.rect(20, pdf.get_y(), page_width, 25, 'F')
        
        pdf.set_font("Arial", "B", 10)
        pdf.cell(60, 6, "  Customer ID:", 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"{receipt_data.get('renter', {}).get('id', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(60, 6, "  Username:", 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"{receipt_data.get('renter', {}).get('username', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(60, 6, "  Email:", 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"{receipt_data.get('renter', {}).get('email', 'N/A')}", ln=True)
        pdf.ln(5)
        
        # Owner Information with styled box
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 8, "Owner Details:", ln=True)
        
        pdf.set_fill_color(240, 253, 244)  # Light green background
        pdf.rect(20, pdf.get_y(), page_width, 25, 'F')
        
        pdf.set_font("Arial", "B", 10)
        pdf.cell(60, 6, "  Owner ID:", 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"{receipt_data.get('owner', {}).get('id', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(60, 6, "  Username:", 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"{receipt_data.get('owner', {}).get('username', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(60, 6, "  Email:", 0)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"{receipt_data.get('owner', {}).get('email', 'N/A')}", ln=True)
        pdf.ln(10)
        
        # Rental Item Information section with enhanced styling
        pdf.set_font("Arial", "B", 16)
        pdf.set_text_color(59, 130, 246)  # Blue color for section headers
        pdf.cell(0, 10, "Rental Item Details", ln=True)
        pdf.ln(5)
        
        # Create a styled box for rental item details
        pdf.set_fill_color(254, 242, 242)  # Light red background
        pdf.rect(20, pdf.get_y(), page_width, 25, 'F')
        
        pdf.set_font("Arial", "B", 11)
        pdf.set_text_color(0, 0, 0)
        rental_item = receipt_data.get('rental_item', {})
        pdf.cell(60, 7, "Item ID:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{rental_item.get('id', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Item Name:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{rental_item.get('name', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Category:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{rental_item.get('category', 'N/A')}", ln=True)
        pdf.ln(10)
        
        # Payment Details section with enhanced table styling
        pdf.set_font("Arial", "B", 16)
        pdf.set_text_color(59, 130, 246)  # Blue color for section headers
        pdf.cell(0, 10, "Payment Summary", ln=True)
        pdf.ln(5)
        
        # Create a beautiful table-like structure for payment details
        pdf.set_font("Arial", "B", 12)
        pdf.set_fill_color(59, 130, 246)  # Blue header background
        pdf.set_text_color(255, 255, 255)  # White text for header
        pdf.cell(100, 10, "Description", 1, 0, 'C', True)
        pdf.cell(60, 10, "Amount ($)", 1, 0, 'C', True)
        pdf.ln()
        
        # Reset text color for content
        pdf.set_text_color(0, 0, 0)
        pdf.set_fill_color(255, 255, 255)  # White background for content
        
        pdf.set_font("Arial", "", 11)
        pdf.cell(100, 8, "Rental Amount", 1, 0, 'L', True)
        pdf.cell(60, 8, f"${receipt_data.get('payment_amount', '0.00')}", 1, 0, 'R', True)
        pdf.ln()
        
        pdf.cell(100, 8, "Service Fee", 1, 0, 'L', True)
        pdf.cell(60, 8, f"${receipt_data.get('service_fee', '0.00')}", 1, 0, 'R', True)
        pdf.ln()
        
        # Total row with special styling
        pdf.set_font("Arial", "B", 12)
        pdf.set_fill_color(34, 197, 94)  # Green background for total
        pdf.set_text_color(255, 255, 255)  # White text for total
        pdf.cell(100, 10, "TOTAL AMOUNT", 1, 0, 'L', True)
        pdf.cell(60, 10, f"${receipt_data.get('total_amount', '0.00')}", 1, 0, 'R', True)
        pdf.ln()
        
        # Reset colors
        pdf.set_fill_color(255, 255, 255)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(8)
        
        # Additional payment information with enhanced styling
        pdf.set_font("Arial", "B", 14)
        pdf.set_text_color(59, 130, 246)  # Blue color for section headers
        pdf.cell(0, 8, "Payment Details", ln=True)
        pdf.ln(5)
        
        # Create a styled box for payment details
        pdf.set_fill_color(255, 251, 235)  # Light yellow background
        pdf.rect(20, pdf.get_y(), page_width, 35, 'F')
        
        pdf.set_font("Arial", "B", 11)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(60, 7, "Payment Status:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{receipt_data.get('payment_status', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Payment Method:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{receipt_data.get('payment_method', 'N/A')}", ln=True)
        pdf.set_font("Arial", "B", 11)
        pdf.cell(60, 7, "Payment Account:", 0)
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, f"{receipt_data.get('payment_account', 'N/A')}", ln=True)
        
        if receipt_data.get('payment_released_at'):
            pdf.set_font("Arial", "B", 11)
            pdf.cell(60, 7, "Payment Released:", 0)
            pdf.set_font("Arial", "", 11)
            pdf.cell(0, 7, f"{receipt_data.get('payment_released_at', 'N/A')}", ln=True)
        pdf.ln(10)
        
        # Footer section with enhanced styling
        pdf.line(20, pdf.get_y(), page_width + 20, pdf.get_y())  # Separator line
        pdf.ln(8)
        
        # Thank you message with enhanced styling
        pdf.set_font("Arial", "B", 12)
        pdf.set_text_color(59, 130, 246)  # Blue color
        pdf.cell(0, 8, "Thank you for choosing Rent System!", ln=True, align="C")
        pdf.ln(3)
        
        # Support information
        pdf.set_font("Arial", "I", 10)
        pdf.set_text_color(107, 114, 128)  # Gray color
        pdf.cell(0, 6, "For support, contact: support@rentsystem.com", ln=True, align="C")
        pdf.cell(0, 6, "This is an official receipt. Please keep for your records.", ln=True, align="C")
        
        # Add timestamp at bottom with styling
        from datetime import datetime
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        pdf.ln(8)
        pdf.set_font("Arial", "", 9)
        pdf.set_text_color(156, 163, 175)  # Light gray color
        pdf.cell(0, 5, f"Generated on: {current_time}", ln=True, align="C")
        pdf.cell(0, 5, "Rent System - Your Trusted Rental Platform", ln=True, align="C")

        print(f"[RECEIPT] 🔍 PDF content created successfully")
        
        # Output PDF as bytes
        try:
            print(f"[RECEIPT] 🔍 Converting PDF to bytes...")
            # Use a temporary file approach for FPDF compatibility
            import tempfile
            import os
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_filename = temp_file.name
                print(f"[RECEIPT] 🔍 Using temp file: {temp_filename}")
            
            # Output to temporary file
            pdf.output(temp_filename)
            print(f"[RECEIPT] 🔍 PDF written to temp file successfully")
            
            # Read the file back into memory
            with open(temp_filename, 'rb') as temp_file:
                pdf_data = temp_file.read()
            
            # Clean up temporary file
            try:
                os.unlink(temp_filename)
                print(f"[RECEIPT] 🔍 Temp file cleaned up")
            except Exception as cleanup_error:
                print(f"[RECEIPT] ⚠️ Warning: Could not clean up temp file: {cleanup_error}")
            
            # Create BytesIO object from the data
            pdf_bytes = io.BytesIO(pdf_data)
            pdf_bytes.seek(0)
            
            print(f"[RECEIPT] ✅ PDF converted to bytes successfully, size: {len(pdf_data)} bytes")
            
        except Exception as conversion_error:
            print(f"[RECEIPT] ❌ Error converting PDF to bytes: {str(conversion_error)}")
            raise conversion_error
        
    except Exception as e:
        print(f"[RECEIPT] ❌ Error creating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Try to create a simple fallback PDF
        try:
            print(f"[RECEIPT] 🔄 Trying fallback PDF creation...")
            pdf = FPDF()
            pdf.add_page()
            
            # Set page margins and dimensions
            pdf.set_margins(20, 20, 20)
            page_width = pdf.w - 40  # Available width after margins
            
            # Add company logo and header
            pdf.set_font("Arial", "B", 24)
            pdf.cell(0, 15, "RENT SYSTEM", ln=True, align="C")
            
            # Add logo placeholder
            pdf.set_font("Arial", "", 12)
            pdf.cell(0, 8, "Your Trusted Rental Platform", ln=True, align="C")
            pdf.ln(5)
            
            # Add receipt title with underline
            pdf.set_font("Arial", "B", 18)
            pdf.cell(0, 10, "PAYMENT RECEIPT", ln=True, align="C")
            pdf.line(20, pdf.get_y(), page_width + 20, pdf.get_y())  # Underline
            pdf.ln(8)
            
            # Receipt details section
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 8, "Receipt Information", ln=True)
            pdf.ln(3)
            
            pdf.set_font("Arial", "", 11)
            pdf.cell(60, 6, "Receipt Number:", 0)
            pdf.cell(0, 6, f"#{booking.id}", ln=True)
            
            pdf.cell(60, 6, "Status:", 0)
            pdf.cell(0, 6, f"{booking.status}", ln=True)
            
            pdf.cell(60, 6, "Issue Date:", 0)
            pdf.cell(0, 6, f"{booking.created_at}", ln=True)
            pdf.ln(8)
            
            # Payment Summary section
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 8, "Payment Summary", ln=True)
            pdf.ln(3)
            
            # Create a table-like structure for payment details
            pdf.set_font("Arial", "B", 11)
            pdf.cell(100, 8, "Description", 1)
            pdf.cell(60, 8, "Amount ($)", 1, ln=True)
            
            pdf.set_font("Arial", "", 10)
            pdf.cell(100, 7, "Rental Amount", 1)
            pdf.cell(60, 7, f"${getattr(booking, 'payment_amount', '0.00')}", 1, ln=True)
            
            pdf.cell(100, 7, "Service Fee", 1)
            pdf.cell(60, 7, f"${getattr(booking, 'service_fee', '0.00')}", 1, ln=True)
            
            pdf.set_font("Arial", "B", 11)
            total_amount = float(getattr(booking, 'payment_amount', 0)) + float(getattr(booking, 'service_fee', 0))
            pdf.cell(100, 8, "TOTAL AMOUNT", 1)
            pdf.cell(60, 8, f"${total_amount:.2f}", 1, ln=True)
            pdf.ln(5)
            
            # Footer section
            pdf.line(20, pdf.get_y(), page_width + 20, pdf.get_y())  # Separator line
            pdf.ln(5)
            
            pdf.set_font("Arial", "I", 9)
            pdf.cell(0, 5, "Thank you for choosing Rent System!", ln=True, align="C")
            pdf.cell(0, 5, "For support, contact: support@rentsystem.com", ln=True, align="C")
            pdf.cell(0, 5, "This is an official receipt. Please keep for your records.", ln=True, align="C")
            
            # Add timestamp at bottom
            from datetime import datetime
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            pdf.ln(5)
            pdf.set_font("Arial", "", 8)
            pdf.cell(0, 4, f"Generated on: {current_time}", ln=True, align="C")
            
            # Use temporary file approach for FPDF compatibility
            import tempfile
            import os
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_filename = temp_file.name
                print(f"[RECEIPT] 🔄 Fallback using temp file: {temp_filename}")
            
            # Output to temporary file
            pdf.output(temp_filename)
            print(f"[RECEIPT] 🔄 Fallback PDF written to temp file successfully")
            
            # Read the file back into memory
            with open(temp_filename, 'rb') as temp_file:
                pdf_data = temp_file.read()
            
            # Clean up temporary file
            try:
                os.unlink(temp_filename)
                print(f"[RECEIPT] 🔄 Fallback temp file cleaned up")
            except Exception as cleanup_error:
                print(f"[RECEIPT] ⚠️ Warning: Could not clean up fallback temp file: {cleanup_error}")
            
            # Create BytesIO object from the data
            pdf_bytes = io.BytesIO(pdf_data)
            pdf_bytes.seek(0)
            print(f"[RECEIPT] ✅ Fallback PDF generated successfully")
            
        except Exception as fallback_error:
            print(f"[RECEIPT] ❌ Fallback PDF also failed: {str(fallback_error)}")
            return jsonify({"error": f"Failed to create PDF: {str(e)}"}), 500

    # Return the PDF file properly
    try:
        # Get the PDF bytes
        pdf_data = pdf_bytes.getvalue()
        
        # Create response with PDF data
        from flask import Response
        response = Response(pdf_data, mimetype='application/pdf')
        response.headers['Content-Disposition'] = f'attachment; filename=booking_{booking.id}_receipt.pdf'
        return response
        
    except Exception as e:
        print(f"[RECEIPT] ❌ Error sending PDF file: {str(e)}")
        # Fallback: return PDF as base64 encoded string
        import base64
        pdf_base64 = base64.b64encode(pdf_bytes.getvalue()).decode('utf-8')
        return jsonify({
            "pdf_data": pdf_base64,
            "filename": f"booking_{booking.id}_receipt.pdf"
        }), 200
