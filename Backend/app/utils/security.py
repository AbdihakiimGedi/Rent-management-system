from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from app.models.user import User
from app.extensions import db
from datetime import datetime, timedelta
import os

def _get_secret_key():
    # Resolve from Flask app config; fallback for safety
    try:
        return current_app.config.get('SECRET_KEY', 'supersecretkey')
    except Exception:
        return 'supersecretkey'

def hash_password(password):
    return generate_password_hash(password)

def verify_password(password, hashed):
    return check_password_hash(hashed, password)

def generate_jwt(user_id, role):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, _get_secret_key(), algorithm='HS256')
    # PyJWT <2 returns bytes, >=2 returns str. Normalize to str.
    if isinstance(token, bytes):
        try:
            token = token.decode('utf-8')
        except Exception:
            token = token.decode()
    return token

def verify_jwt(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    """JWT authentication decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None

        # Prefer Authorization header (case-insensitive)
        auth_header = request.headers.get('Authorization') or request.headers.get('authorization')
        print(f"[DEBUG] JWT Required - Auth header: {auth_header}")

        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
            elif len(parts) == 1:
                # Some clients may send raw token without Bearer prefix
                token = parts[0]
            else:
                print(f"[DEBUG] JWT Required - Invalid token format: {auth_header}")
        
        # Fallbacks: common custom headers or cookie
        if not token:
            token = request.headers.get('X-Access-Token') or request.headers.get('x-access-token')
        if not token:
            token = request.cookies.get('token')

        if token:
            try:
                print(f"[DEBUG] JWT Required - Extracted token (first 20): {str(token)[:20]}...")
            except Exception:
                pass
        else:
            print(f"[DEBUG] JWT Required - No token found in headers or cookies")
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            payload = verify_jwt(token)
            print(f"[DEBUG] JWT Required - Token payload: {payload}")
            
            if not payload:
                print(f"[DEBUG] JWT Required - Invalid or expired token")
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Get user from database
            user = User.query.get(payload['user_id'])
            print(f"[DEBUG] JWT Required - User from DB: {user}")
            print(f"[DEBUG] JWT Required - User ID: {payload.get('user_id')}")
            print(f"[DEBUG] JWT Required - User role from payload: {payload.get('role')}")
            
            if not user:
                print(f"[DEBUG] JWT Required - User not found in DB for ID: {payload.get('user_id')}")
                return jsonify({"error": "User not found"}), 401
            
            print(f"[DEBUG] JWT Required - User details: ID={user.id}, username={user.username}, role={user.role}, active={user.is_active}")
            
            # Check if user is active
            if hasattr(user, 'is_active') and not user.is_active:
                print(f"[DEBUG] JWT Required - User is inactive")
                return jsonify({"error": "User account is inactive"}), 401
            
            # Add user to request context
            request.current_user = user
            print(f"[DEBUG] JWT Required - User added to request context: {user.username} (role: {user.role})")
            print(f"[DEBUG] JWT Required - Successfully authenticated user: {user.username}")
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"[DEBUG] JWT Required - Exception: {e}")
            print(f"[DEBUG] JWT Required - Exception type: {type(e)}")
            print(f"[DEBUG] JWT Required - Exception details: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
    
    return decorated_function

def admin_required(f):
    """Admin role required decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"[DEBUG] Admin Required - Checking admin privileges")
        print(f"[DEBUG] Admin Required - Request current_user: {getattr(request, 'current_user', 'None')}")
        
        if not hasattr(request, 'current_user'):
            print(f"[DEBUG] Admin Required - No current_user found")
            return jsonify({"error": "Authentication required"}), 401
        
        print(f"[DEBUG] Admin Required - User role: {request.current_user.role}")
        
        if request.current_user.role != 'admin':
            print(f"[DEBUG] Admin Required - User is not admin")
            return jsonify({"error": "Admin privileges required"}), 403
        
        print(f"[DEBUG] Admin Required - Admin access granted")
        return f(*args, **kwargs)
    
    return decorated_function

def owner_required(f):
    """Owner role required decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"[DEBUG] Owner Required - Checking owner privileges")
        print(f"[DEBUG] Owner Required - Request current_user: {getattr(request, 'current_user', 'None')}")
        
        if not hasattr(request, 'current_user'):
            print(f"[DEBUG] Owner Required - No current_user found")
            return jsonify({"error": "Authentication required"}), 401
        
        print(f"[DEBUG] Owner Required - User role: {request.current_user.role}")
        
        if request.current_user.role != 'owner':
            print(f"[DEBUG] Owner Required - User role is not owner: {request.current_user.role}")
            return jsonify({"error": "Owner privileges required"}), 403
        
        print(f"[DEBUG] Owner Required - Owner access granted")
        return f(*args, **kwargs)
    
    return decorated_function
