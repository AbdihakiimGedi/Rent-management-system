import os
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from flask_login import LoginManager
from app.extensions import db, migrate, mail
from app.config import Config
from app.models.user import User

# === Import all Blueprints ===
from app.routes.auth import auth_bp
from app.routes.owner import owner_bp
from app.routes.admin import admin_bp

from app.routes.booking_routes import rental_input_bp
from app.routes.Booking import booking_bp
from app.routes.rental_delivery import rental_delivery_bp
from app.routes.payment_routes import payment_bp
from app.routes.complaints import complaint_bp
from app.routes.notification_routes import notification_bp
from app.routes.reports_routes import reports_bp
from app.routes.receipt_routes import receipt_bp
from app.routes.restriction_routes import restriction_bp
from app.routes.rental_browsing import rental_browsing_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # === Extensions ===
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    # === CORS ===
    frontend_origin = getattr(Config, 'FRONTEND_ORIGIN', "http://localhost:5173")
    CORS(app,
         resources={r"/*": {"origins": [frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"]}},
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"])
    # === Flask-Login ===
    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # === Register Blueprints ===
    app.register_blueprint(auth_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(admin_bp)

    app.register_blueprint(rental_input_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(rental_delivery_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(complaint_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(receipt_bp)
    app.register_blueprint(restriction_bp)
    app.register_blueprint(rental_browsing_bp)

    # === Test Static File Serving ===
    @app.route("/test-image")
    def test_image():
        """Test endpoint to verify static file serving"""
        test_file = "rental_items/ce24ee53-5838-4435-8bf6-d850430d2255.jpg"
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], test_file)
        exists = os.path.exists(full_path)
        return jsonify({
            "test_file": test_file,
            "full_path": full_path,
            "exists": exists,
            "upload_folder": app.config['UPLOAD_FOLDER']
        })

    # === Serve Uploaded Files ===
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        # Normalize the filename to handle Windows backslashes
        normalized_filename = filename.replace('\\', '/')
        
        # Split the path to get directory and filename
        path_parts = normalized_filename.split('/')
        if len(path_parts) > 1:
            # Has subdirectory
            subdirectory = '/'.join(path_parts[:-1])
            filename_only = path_parts[-1]
            
            # Construct full path
            full_path = os.path.join(app.config['UPLOAD_FOLDER'], subdirectory, filename_only)
            
            # Check if file exists
            if os.path.exists(full_path):
                return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], subdirectory), filename_only)
            else:
                return jsonify({"error": "File not found"}), 404
        else:
            # No subdirectory
            full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            if os.path.exists(full_path):
                return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
            else:
                return jsonify({"error": "File not found"}), 404

    # === Handle Method Not Allowed ===
    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method Not Allowed"}), 405

    # === Handle 404 ===
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource Not Found"}), 404

    return app
