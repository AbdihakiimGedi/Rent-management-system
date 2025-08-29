from app.extensions  import db
import json

class CategoryRequirement(db.Model):
    __tablename__ = "category_requirements"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # Changed from field_name
    field_type = db.Column(db.String(20), nullable=False)  # Changed from Enum to String
    is_required = db.Column(db.Boolean, default=True)  # Changed from required
    placeholder = db.Column(db.String(255), nullable=True)  # Changed from options
    max_images = db.Column(db.Integer, nullable=False, default=1)  # Fixed: NOT NULL with default

    # For backward compatibility, add properties that map to the new structure
    @property
    def field_name(self):
        """Backward compatibility property"""
        return self.name
    
    @property
    def required(self):
        """Backward compatibility property"""
        return self.is_required
    
    @property
    def options(self):
        """Backward compatibility property - parse placeholder as options if it's JSON"""
        if self.placeholder:
            try:
                return json.loads(self.placeholder)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_options(self, options_list):
        """Store list as JSON string in placeholder field"""
        self.placeholder = json.dumps(options_list)

    def get_options(self):
        """Return JSON string as Python list from placeholder field"""
        return self.options
