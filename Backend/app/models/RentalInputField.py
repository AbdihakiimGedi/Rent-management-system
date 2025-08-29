from app.extensions import db
from datetime import datetime
import json

class RenterInputField(db.Model):
    __tablename__ = "rental_input_fields"  # Match the existing table name

    id = db.Column(db.Integer, primary_key=True)
    rental_item_id = db.Column(db.Integer, db.ForeignKey("rental_items.id"), nullable=False)
    label = db.Column(db.String(255), nullable=False)  # Actual column name in DB
    field_type = db.Column(db.String(50), nullable=False)  # string, number, date, file, selection, textarea, contract_accept
    is_required = db.Column(db.Boolean, default=True)  # Actual column name in DB
    field_key = db.Column(db.String(100), nullable=True)  # Actual column name in DB
    is_financial = db.Column(db.Boolean, default=False)  # Actual column name in DB
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    extra_config = db.Column(db.Text, nullable=True)  # Actual column name in DB

    # Map to existing columns if they exist
    @property
    def field_name(self):
        return getattr(self, 'label', '')
    
    @property
    def required(self):
        return getattr(self, 'is_required', True)
    
    @property
    def order_index(self):
        return 0  # Default value since column doesn't exist
    
    @property
    def placeholder(self):
        return ""  # Default value since column doesn't exist
    
    @property
    def help_text(self):
        return ""  # Default value since column doesn't exist

    def safe_get(self, attr_name, default=None):
        """Safely get attribute value, handling missing columns"""
        return getattr(self, attr_name, default)

    # Relationship handled via RentalItem backref

    def get_options(self):
        if hasattr(self, 'extra_config') and self.extra_config:
            try:
                config = json.loads(self.extra_config)
                return config.get('options', [])
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_options(self, options_list):
        if hasattr(self, 'extra_config'):
            if options_list is not None:
                # Get existing config or create new
                try:
                    config = json.loads(self.extra_config) if self.extra_config else {}
                except (json.JSONDecodeError, TypeError):
                    config = {}
                config['options'] = options_list
                self.extra_config = json.dumps(config)
            else:
                self.extra_config = None

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "rental_item_id": self.rental_item_id,
            "field_name": getattr(self, 'label', ''),
            "field_type": getattr(self, 'field_type', 'string'),
            "required": getattr(self, 'is_required', True),
            "options": self.get_options(),
            "placeholder": getattr(self, 'placeholder', ''),
            "help_text": getattr(self, 'help_text', ''),
            "order_index": getattr(self, 'order_index', 0),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
