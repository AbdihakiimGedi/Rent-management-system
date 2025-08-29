from flask_mail import Mail, Message
from flask import Flask

app = Flask(__name__)
app.config.from_object('config.Config')  # Your config file

mail = Mail(app)

with app.app_context():
    msg = Message(
        "Test Email",
        sender=app.config["MAIL_DEFAULT_SENDER"],
        recipients=["your_own_email@gmail.com"],
        body="This is a test email from Flask-Mail."
    )
    mail.send(msg)
    print("Test email sent!")
