from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()
bcrypt = Bcrypt()
# Optional: redirect to login page if not logged in
login_manager.login_view = "auth.login"
