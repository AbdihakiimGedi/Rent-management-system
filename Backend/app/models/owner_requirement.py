from app.extensions import db
from datetime import datetime
import json

class OwnerRequirement(db.Model):
    __tablename__ = "owner_requirements"

    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(255), nullable=False)
    field_name = db.Column(db.String(255), nullable=False, unique=True)
    input_type = db.Column(db.String(50), nullable=False)  # text, number, textarea, dropdown, file, date
    is_required = db.Column(db.Boolean, default=True)
    placeholder = db.Column(db.String(255), nullable=True)
    help_text = db.Column(db.Text, nullable=True)
    options = db.Column(db.Text, nullable=True)  # JSON for dropdown type
    validation_rules = db.Column(db.Text, nullable=True)  # JSON for validation rules
    order_index = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_options(self):
        """Return dropdown options as Python list"""
        if self.options:
            return json.loads(self.options)
        return []

    def set_options(self, options_list):
        """Store dropdown options as JSON string"""
        if options_list is not None:
            self.options = json.dumps(options_list)
        else:
            self.options = None

    def get_validation_rules(self):
        """Return validation rules as Python dict"""
        if self.validation_rules:
            return json.loads(self.validation_rules)
        return {}

    def set_validation_rules(self, rules_dict):
        """Store validation rules as JSON string"""
        if rules_dict is not None:
            self.validation_rules = json.dumps(rules_dict)
        else:
            self.validation_rules = None

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'label': self.label,
            'field_name': self.field_name,
            'input_type': self.input_type,
            'is_required': self.is_required,
            'placeholder': self.placeholder,
            'help_text': self.help_text,
            'options': self.get_options(),
            'validation_rules': self.get_validation_rules(),
            'order_index': self.order_index,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }



