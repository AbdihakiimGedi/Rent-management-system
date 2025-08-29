from app.extensions import db

class BookingInputAnswer(db.Model):
    __tablename__ = 'booking_input_answers'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    input_field_id = db.Column(db.Integer, db.ForeignKey('rental_input_fields.id'), nullable=False)  # Fixed table name

    value = db.Column(db.Text, nullable=False)  # Can be text, numbers, file paths (comma separated if multiple)

    # Relationships
    booking = db.relationship('Booking', backref='input_answers')
    input_field = db.relationship('RenterInputField', backref='booking_answers')  # Fixed class name

    def __repr__(self):
        return f"<BookingInputAnswer {self.id} for Booking {self.booking_id} Field {self.input_field_id}>"
