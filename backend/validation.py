# backend/validation.py
import re
from datetime import datetime
from typing import Dict, List, Optional, Union

class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")

def validate_email(email: str) -> str:
    """Validate email format"""
    if not email or not isinstance(email, str):
        raise ValidationError("email", "Email is required and must be a string")
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("email", "Invalid email format")
    
    return email.lower().strip()

def validate_password(password: str, field_name: str = "password") -> str:
    """Validate password"""
    if not password or not isinstance(password, str):
        raise ValidationError(field_name, f"{field_name.capitalize()} is required and must be a string")
    
    if len(password) < 6:
        raise ValidationError(field_name, f"{field_name.capitalize()} must be at least 6 characters long")
    
    return password

def validate_name(name: str) -> Optional[str]:
    """Validate name (optional)"""
    if name is None:
        return None
    
    if not isinstance(name, str):
        raise ValidationError("name", "Name must be a string")
    
    name = name.strip()
    if len(name) > 100:
        raise ValidationError("name", "Name must be less than 100 characters")
    
    return name if name else None

def validate_role(role: str) -> str:
    """Validate user role"""
    if not role or not isinstance(role, str):
        raise ValidationError("role", "Role is required and must be a string")
    
    role = role.lower()
    if role not in ['user', 'admin']:
        raise ValidationError("role", "Role must be either 'user' or 'admin'")
    
    return role

def validate_prediction_input(data: Dict, model_version: str, features: List[str]) -> Dict:
    """Validate prediction input data"""
    errors = {}
    validated_data = {}
    
    # Check required features
    for feature in features:
        if feature not in data:
            errors[feature] = f"Missing required field: {feature}"
            continue
        
        value = data[feature]
        
        # Validate type (should be numeric for prediction)
        try:
            # Try to convert to float
            numeric_value = float(value)
            validated_data[feature] = numeric_value
            
            # Validate ranges for known features
            if feature == 'LAT_WGS84':
                if not (-90 <= numeric_value <= 90):
                    errors[feature] = "Latitude must be between -90 and 90"
            
            elif feature == 'LONG_WGS84':
                if not (-180 <= numeric_value <= 180):
                    errors[feature] = "Longitude must be between -180 and 180"
            
            elif feature == 'OCC_MONTH':
                if not (1 <= numeric_value <= 12):
                    errors[feature] = "Month must be between 1 and 12"
            
            elif feature == 'OCC_HOUR':
                if not (0 <= numeric_value <= 23):
                    errors[feature] = "Hour must be between 0 and 23"
            
            elif feature == 'BIKE_COST':
                if numeric_value < 0:
                    errors[feature] = "Bike cost cannot be negative"
                    
        except (ValueError, TypeError):
            errors[feature] = f"Invalid value for {feature}. Must be a number"
    
    return validated_data, errors

def validate_message_input(data: Dict) -> Dict:
    """Validate message input data"""
    errors = {}
    validated = {}
    
    # Required fields
    required_fields = ['subject', 'body', 'recipient_admin']
    for field in required_fields:
        if field not in data or not data[field]:
            errors[field] = f"{field.replace('_', ' ').title()} is required"
        elif not isinstance(data[field], str):
            errors[field] = f"{field.replace('_', ' ').title()} must be a string"
        else:
            value = data[field].strip()
            if not value:
                errors[field] = f"{field.replace('_', ' ').title()} cannot be empty"
            elif len(value) > 500:
                errors[field] = f"{field.replace('_', ' ').title()} must be less than 500 characters"
            else:
                validated[field] = value
    
    return validated, errors

def validate_reply_input(data: Dict) -> Dict:
    """Validate reply input data"""
    errors = {}
    validated = {}
    
    if 'body' not in data or not data['body']:
        errors['body'] = "Reply body is required"
    elif not isinstance(data['body'], str):
        errors['body'] = "Reply body must be a string"
    else:
        body = data['body'].strip()
        if not body:
            errors['body'] = "Reply body cannot be empty"
        elif len(body) > 1000:
            errors['body'] = "Reply body must be less than 1000 characters"
        else:
            validated['body'] = body
    
    return validated, errors

def validate_profile_update(data: Dict) -> Dict:
    """Validate profile update data"""
    errors = {}
    validated = {}
    
    # Name validation (optional)
    if 'name' in data:
        if data['name'] is not None:
            try:
                validated['name'] = validate_name(data['name'])
            except ValidationError as e:
                errors[e.field] = e.message
    
    # Email validation (optional)
    if 'new_email' in data and data['new_email']:
        try:
            validated['new_email'] = validate_email(data['new_email'])
        except ValidationError as e:
            errors[e.field] = e.message
    
    # Password validation (optional)
    if 'new_password' in data and data['new_password']:
        try:
            validated['new_password'] = validate_password(data['new_password'], "new_password")
        except ValidationError as e:
            errors[e.field] = e.message
        
        # Check confirmation password
        if 'confirm_password' not in data or not data['confirm_password']:
            errors['confirm_password'] = "Please confirm your new password"
        elif data['new_password'] != data['confirm_password']:
            errors['confirm_password'] = "New password and confirmation do not match"
    
    # Current password required for sensitive changes
    sensitive_changes = ['new_email', 'new_password']
    has_sensitive_change = any(field in data and data[field] for field in sensitive_changes)
    if has_sensitive_change and 'current_password' not in data:
        errors['current_password'] = "Current password is required for this change"
    
    return validated, errors