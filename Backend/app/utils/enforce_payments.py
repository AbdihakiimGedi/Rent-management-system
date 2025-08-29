from datetime import datetime, timedelta
from app.extensions import db
from app.models.booking import Booking

def enforce_payment_deadline():
    now = datetime.utcnow()
    deadline = now - timedelta(hours=24)
    bookings = Booking.query.filter(
        Booking.status=="Pending",
        Booking.created_at <= deadline
    ).all()

    for booking in bookings:
        success, msg = booking.release_payment_logic()
        db.session.add(booking)
        if success:
            print(f"Booking #{booking.id} payment processed automatically.")
        else:
            print(f"Booking #{booking.id} pending: {msg}")

    db.session.commit()

if __name__ == "__main__":
    enforce_payment_deadline()
