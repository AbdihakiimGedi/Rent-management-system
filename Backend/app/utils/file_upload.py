import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from PIL import Image
import io

def allowed_file(filename, allowed_extensions=None):
    """Check if file extension is allowed"""
    if allowed_extensions is None:
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'webp'})
    
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def generate_unique_filename(original_filename):
    """Generate a unique filename to prevent conflicts"""
    # Get file extension
    file_ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    
    # Generate unique name
    unique_name = str(uuid.uuid4())
    
    # Return filename with extension
    return f"{unique_name}.{file_ext}" if file_ext else unique_name

def save_image_file(file, folder="rental_items", resize=True, max_size=(800, 800)):
    """
    Save an uploaded image file with optional resizing
    
    Args:
        file: FileStorage object from Flask
        folder: Subfolder within uploads directory
        resize: Whether to resize the image
        max_size: Maximum dimensions (width, height)
    
    Returns:
        dict: Contains 'success', 'file_path', 'error' keys
    """
    try:
        # Check if file exists and has valid name
        if file is None or file.filename == '':
            return {'success': False, 'error': 'No file selected'}
        
        # Validate file extension
        if not allowed_file(file.filename):
            return {'success': False, 'error': 'File type not allowed'}
        
        # Create upload directory if it doesn't exist
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        folder_path = os.path.join(upload_folder, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Generate unique filename
        filename = generate_unique_filename(file.filename)
        file_path = os.path.join(folder_path, filename)
        
        # Read and process image
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Resize image if requested
        if resize and (image.width > max_size[0] or image.height > max_size[1]):
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save processed image
        image.save(file_path, quality=85, optimize=True)
        
        # Return relative path for database storage
        relative_path = os.path.join(folder, filename)
        
        return {
            'success': True,
            'file_path': relative_path,
            'full_path': file_path,
            'filename': filename,
            'size': os.path.getsize(file_path)
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def delete_file(file_path):
    """Delete a file from the uploads directory"""
    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        full_path = os.path.join(upload_folder, file_path)
        
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
        return False

def get_file_url(file_path):
    """Get the full URL for a file path"""
    if not file_path:
        return None
    
    # For development, return relative path
    # In production, you might want to return a full CDN URL
    return f"/uploads/{file_path}"

def validate_image_file(file):
    """Validate image file before processing"""
    try:
        # Check file size
        max_size = current_app.config.get('MAX_CONTENT_LENGTH', 5 * 1024 * 1024)  # 5MB default
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > max_size:
            return {'valid': False, 'error': f'File size exceeds {max_size // (1024*1024)}MB limit'}
        
        # Check if it's actually an image
        try:
            image = Image.open(file)
            image.verify()
            file.seek(0)  # Reset after verify
        except Exception:
            return {'valid': False, 'error': 'Invalid image file'}
        
        return {'valid': True}
        
    except Exception as e:
        return {'valid': False, 'error': str(e)}





