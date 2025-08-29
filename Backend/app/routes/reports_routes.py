# app/routes/reports_routes.py
from flask import Blueprint, request, jsonify, send_file
from app.extensions import db
from app.models.booking import Booking
from app.models.RentalItem import RentalItem
from app.models.user import User
from datetime import datetime
import io
import csv
from fpdf import FPDF
import json
from app.utils.security import jwt_required, admin_required

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")


# ------------------- Helper Functions -------------------
def validate_date(date_text):
    try:
        return datetime.strptime(date_text, "%Y-%m-%d")
    except ValueError:
        return None


def generate_pdf_report(data, title="Report"):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, title, ln=True, align="C")
    pdf.ln(10)
    pdf.set_font("Arial", "", 12)

    for row in data:
        for key, value in row.items():
            pdf.cell(0, 8, f"{key}: {value}", ln=True)
        pdf.ln(5)
    buffer = io.BytesIO()
    pdf.output(buffer)
    buffer.seek(0)
    return buffer


def generate_csv_report(data):
    buffer = io.StringIO()
    if data:
        writer = csv.DictWriter(buffer, fieldnames=list(data[0].keys()))
        writer.writeheader()
        for row in data:
            writer.writerow(row)
    buffer.seek(0)
    return io.BytesIO(buffer.read().encode())


# ------------------- Earnings Summary -------------------
@reports_bp.route("/earnings", methods=["GET"])
@jwt_required
def earnings_summary():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    filters = []

    if start_date:
        start = validate_date(start_date)
        if not start:
            return jsonify({"error": "Invalid start_date format, must be YYYY-MM-DD"}), 400
        filters.append(Booking.created_at >= start)
    if end_date:
        end = validate_date(end_date)
        if not end:
            return jsonify({"error": "Invalid end_date format, must be YYYY-MM-DD"}), 400
        filters.append(Booking.created_at <= end)

    # Role-based filtering
    if request.current_user.role == "owner":
        filters.append(Booking.owner_id == request.current_user.id)
    elif request.current_user.role == "renter":
        filters.append(Booking.renter_id == request.current_user.id)
    # Admin can see all bookings

    bookings = Booking.query.filter(*filters).all()

    total_payment = sum([float(b.payment_amount) for b in bookings])
    total_service_fee = sum([float(b.service_fee) for b in bookings])
    net_earnings = total_payment - total_service_fee if request.current_user.role != "renter" else total_payment

    data = []
    for b in bookings:
        data.append({
            "Booking ID": b.id,
            "Renter": b.renter.username if b.renter else "Unknown",
            "Owner": b.rental_item.owner.username if b.rental_item and b.rental_item.owner else "Unknown",
            "Rental Item": f"Item #{b.rental_item.id}" if b.rental_item else "Unknown Item",
            "Payment": float(b.payment_amount) if b.payment_amount else 0,
            "Service Fee": float(b.service_fee) if b.service_fee else 0,
            "Net Owner": float(float(b.payment_amount or 0) - float(b.service_fee or 0)),
            "Payment Status": b.payment_status or "Unknown",
            "Created At": b.created_at.strftime("%Y-%m-%d %H:%M:%S") if b.created_at else "Unknown"
        })

    return jsonify({
        "total_payment": total_payment,
        "total_service_fee": total_service_fee,
        "net_earnings": net_earnings,
        "total": len(data),
        "bookings": data
    }), 200


# ------------------- Completed Bookings -------------------
@reports_bp.route("/completed-bookings", methods=["GET"])
@jwt_required
def completed_bookings():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    filters = [Booking.status == "Completed"]

    if start_date:
        start = validate_date(start_date)
        if not start:
            return jsonify({"error": "Invalid start_date format"}), 400
        filters.append(Booking.created_at >= start)
    if end_date:
        end = validate_date(end_date)
        if not end:
            return jsonify({"error": "Invalid end_date format"}), 400
        filters.append(Booking.created_at <= end)

    if request.current_user.role == "owner":
        # Owner can only see bookings for their rental items
        from app.models.RentalItem import RentalItem
        owner_rental_items = RentalItem.query.filter_by(owner_id=request.current_user.id).all()
        rental_item_ids = [item.id for item in owner_rental_items]
        filters.append(Booking.rental_item_id.in_(rental_item_ids))
    elif request.current_user.role == "renter":
        filters.append(Booking.renter_id == request.current_user.id)

    bookings = Booking.query.filter(*filters).all()

    result = []
    for b in bookings:
        result.append({
            "Booking ID": b.id,
            "Renter": b.renter.username if b.renter else "Unknown",
            "Owner": b.rental_item.owner.username if b.rental_item and b.rental_item.owner else "Unknown",
            "Rental Item": f"Item #{b.rental_item.id}" if b.rental_item else "Unknown Item",
            "Payment": float(b.payment_amount) if b.payment_amount else 0,
            "Status": b.status or "Unknown",
            "Created At": b.created_at.strftime("%Y-%m-%d %H:%M:%S") if b.created_at else "Unknown"
        })

    return jsonify({
        "total": len(result),
        "completed_bookings": result
    }), 200


# ------------------- Export Reports -------------------
@reports_bp.route("/export", methods=["GET"])
@jwt_required
def export_report():
    report_type = request.args.get("type", "earnings")  # earnings or completed
    format_type = request.args.get("format", "pdf")  # pdf or csv

    if report_type not in ["earnings", "completed"]:
        return jsonify({"error": "Invalid report type"}), 400
    if format_type not in ["pdf", "csv"]:
        return jsonify({"error": "Invalid format"}), 400

    # Reuse previous endpoints logic
    if report_type == "earnings":
        response = earnings_summary()
    else:
        response = completed_bookings()

    data = response.get_json()
    if report_type == "earnings":
        data_rows = data.get("bookings", [])
        title = "Earnings Report"
    else:
        data_rows = data.get("completed_bookings", [])
        title = "Completed Bookings Report"

    if format_type == "pdf":
        buffer = generate_pdf_report(data_rows, title=title)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name=f"{title}.pdf")
    else:
        buffer = generate_csv_report(data_rows)
        return send_file(buffer, mimetype="text/csv", as_attachment=True, download_name=f"{title}.csv")

# ------------------- Admin Reports -------------------

@reports_bp.route("/admin/system-overview", methods=["GET"])
@jwt_required
@admin_required
def admin_system_overview():

    # Get system statistics
    total_users = User.query.count()
    total_owners = User.query.filter_by(role="owner").count()
    total_renters = User.query.filter_by(role="renter").count()
    total_bookings = Booking.query.count()
    total_rental_items = RentalItem.query.count()
    
    # Get recent activity
    recent_bookings = Booking.query.order_by(Booking.created_at.desc()).limit(10).all()
    recent_users = User.query.order_by(User.id.desc()).limit(10).all()
    
    # Calculate revenue
    total_revenue = sum([float(b.payment_amount) for b in Booking.query.all()])
    total_service_fees = sum([float(b.service_fee) for b in Booking.query.all()])
    platform_revenue = total_service_fees

    return jsonify({
        "total": total_users,
        "system_stats": {
            "total_users": total_users,
            "total_owners": total_owners,
            "total_renters": total_renters,
            "total_bookings": total_bookings,
            "total_rental_items": total_rental_items,
            "total_revenue": total_revenue,
            "total_service_fees": total_service_fees,
            "platform_revenue": platform_revenue
        },
        "recent_bookings": [
            {
                "id": b.id,
                "renter": b.renter.username if b.renter else "Unknown",
                "owner": b.rental_item.owner.username if b.rental_item and b.rental_item.owner else "Unknown",
                "rental_item": b.rental_item.category.name if b.rental_item and b.rental_item.category else "Unknown Item",
                "amount": float(b.payment_amount) if b.payment_amount else 0,
                "status": b.status,
                "created_at": b.created_at.strftime("%Y-%m-%d %H:%M:%S") if b.created_at else "Unknown"
            } for b in recent_bookings
        ],
        "recent_users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else "Unknown"
            } for u in recent_users
        ]
    }), 200

@reports_bp.route("/admin/user-analytics", methods=["GET"])
@jwt_required
@admin_required
def admin_user_analytics():

    # Get user statistics by role
    users_by_role = db.session.query(User.role, db.func.count(User.id)).group_by(User.role).all()
    
    # Get active vs inactive users
    active_users = User.query.filter_by(is_active=True).count()
    inactive_users = User.query.filter_by(is_active=False).count()
    
    # Get restricted users
    restricted_users = User.query.filter_by(is_restricted=True).count()

    total_users = sum(dict(users_by_role).values())
    return jsonify({
        "total": total_users,
        "users_by_role": dict(users_by_role),
        "user_status": {
            "active": active_users,
            "inactive": inactive_users,
            "restricted": restricted_users
        }
    }), 200

@reports_bp.route("/admin/booking-analytics", methods=["GET"])
@jwt_required
@admin_required
def admin_booking_analytics():

    # Get booking statistics by status
    bookings_by_status = db.session.query(Booking.status, db.func.count(Booking.id)).group_by(Booking.status).all()
    
    # Get payment statistics by status
    payments_by_status = db.session.query(Booking.payment_status, db.func.count(Booking.id)).group_by(Booking.payment_status).all()
    
    # Get monthly booking trends
    monthly_bookings = db.session.query(
        db.func.date_format(Booking.created_at, '%Y-%m').label('month'),
        db.func.count(Booking.id)
    ).group_by('month').order_by('month').all()

    total_bookings = sum(dict(bookings_by_status).values())
    return jsonify({
        "total": total_bookings,
        "bookings_by_status": dict(bookings_by_status),
        "payments_by_status": dict(payments_by_status),
        "monthly_trends": [
            {
                "month": month,
                "count": count
            } for month, count in monthly_bookings
        ]
    }), 200

@reports_bp.route("/admin/export-system-report", methods=["GET"])
@jwt_required
@admin_required
def admin_export_system_report():

    format_type = request.args.get("format", "pdf")
    
    if format_type not in ["pdf", "csv"]:
        return jsonify({"error": "Invalid format"}), 400

    # Get system overview data
    response = admin_system_overview()
    data = response.get_json()
    
    # Prepare data for export
    export_data = []
    
    # Add system stats
    for key, value in data["system_stats"].items():
        export_data.append({"Metric": key.replace("_", " ").title(), "Value": value})
    
    # Add recent bookings
    for booking in data["recent_bookings"]:
        export_data.append({
            "Type": "Recent Booking",
            "ID": booking["id"],
            "Renter": booking["renter"],
            "Owner": booking["owner"],
            "Item": booking["rental_item"],
            "Amount": booking["amount"],
            "Status": booking["status"],
            "Date": booking["created_at"]
        })
    
    # Add recent users
    for user in data["recent_users"]:
        export_data.append({
            "Type": "Recent User",
            "ID": user["id"],
            "Username": user["username"],
            "Email": user["email"],
            "Role": user["role"],
            "Status": "Active" if user["is_active"] else "Inactive"
        })

    title = "System Overview Report"
    
    if format_type == "pdf":
        buffer = generate_pdf_report(export_data, title=title)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name=f"{title}.pdf")
    else:
        buffer = generate_csv_report(export_data)
        return send_file(buffer, mimetype="text/csv", as_attachment=True, download_name=f"{title}.csv")
