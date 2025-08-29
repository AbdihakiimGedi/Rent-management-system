import os
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_file(file):
    if not allowed_file(file.filename):
        raise ValueError("Invalid file type. Allowed types: png, jpg, jpeg, webp")

    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    return filename  # You can return just filename or full path based on how you display it
