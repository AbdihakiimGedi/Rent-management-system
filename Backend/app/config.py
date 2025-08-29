import os
# Disabled dotenv loading to prevent .env file corruption issues
# load_dotenv()

class Config:
    # Security
    SECRET_KEY = "supersecretkey"

    # Database
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root@localhost/RentSystem"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File uploads
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB

    # Flask-Mail settings
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    
    # Gmail configuration - using hardcoded values to avoid .env file issues
    MAIL_USERNAME = "cabdixakiincumar43@gmail.com"
    MAIL_PASSWORD = "bncmrkpxfatcpyxp"
    MAIL_DEFAULT_SENDER = "cabdixakiincumar43@gmail.com"
    
    # Email is disabled by default - set to True only when email is working
    MAIL_ENABLED = False
