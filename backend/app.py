import os
import pickle
import pandas as pd
import json
import smtplib
import secrets
import shutil
import tempfile
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Define model file paths for v1 and v2
MODEL_PATH_V1 = os.path.join('models', 'stolen_bike_recovery_prediction_model_v1.pkl')
MODEL_PATH_V2 = os.path.join('models', 'stolen_bike_recovery_prediction_model_v2.pkl')

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'  # Change in production
CORS(app, supports_credentials=True)  # Enable CORS for frontend with credentials

# MongoDB configuration
MONGO_URI = "mongodb+srv://sqaher:LR3iKYVjY3yQqdPt@centennialcollegecluste.rkaeskw.mongodb.net/"
DB_NAME = "bike_recovery_ai"

# Initialize MongoDB connection
try:
    client = MongoClient(MONGO_URI)
    # Test the connection
    client.admin.command('ismaster')
    db = client[DB_NAME]
    users_collection = db.users
    tokens_collection = db.password_reset_tokens
    print("Connected to MongoDB successfully!")
except ConnectionFailure:
    print("Failed to connect to MongoDB. Falling back to in-memory storage.")
    client = None
    db = None
    users_collection = None
    tokens_collection = None

# Fallback to in-memory storage if MongoDB is not available
users_db = {}
password_reset_tokens = {}

# Email configuration (you can set these as environment variables)
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = '54m3r05@gmail.com' 
EMAIL_HOST_PASSWORD = 'neua qsrk dwda hobq' 
EMAIL_USE_TLS = True

# MongoDB helper functions
def get_user(email):
    """Get user from MongoDB or fallback storage"""
    if users_collection is not None:
        try:
            user = users_collection.find_one({"email": email})
            return user
        except Exception as e:
            print(f"MongoDB error getting user: {e}")
            return users_db.get(email)
    else:
        return users_db.get(email)

def create_user(email, password, name="", role="user"):
    """Create user in MongoDB or fallback storage"""
    user_data = {
        'email': email,
        'password': generate_password_hash(password),
        'name': name,
        'role': role,
        'created_at': datetime.now().isoformat()
    }
    
    if users_collection is not None:
        try:
            users_collection.insert_one(user_data)
            return True
        except Exception as e:
            print(f"MongoDB error creating user: {e}")
            users_db[email] = user_data
            return True
    else:
        users_db[email] = user_data
        return True

def update_user(email, updates):
    """Update user in MongoDB or fallback storage"""
    if users_collection is not None:
        try:
            users_collection.update_one({"email": email}, {"$set": updates})
            return True
        except Exception as e:
            print(f"MongoDB error updating user: {e}")
            if email in users_db:
                users_db[email].update(updates)
            return True
    else:
        if email in users_db:
            users_db[email].update(updates)
        return True

def delete_user(email):
    """Delete user from MongoDB or fallback storage"""
    if users_collection is not None:
        try:
            users_collection.delete_one({"email": email})
            return True
        except Exception as e:
            print(f"MongoDB error deleting user: {e}")
            if email in users_db:
                del users_db[email]
            return True
    else:
        if email in users_db:
            del users_db[email]
        return True

def get_all_users():
    """Get all users from MongoDB or fallback storage"""
    if users_collection is not None:
        try:
            users = list(users_collection.find({}, {"password": 0}))  # Exclude password field
            # Convert MongoDB ObjectId to string for JSON serialization
            for user in users:
                if '_id' in user:
                    user['_id'] = str(user['_id'])
            return users
        except Exception as e:
            print(f"MongoDB error getting all users: {e}")
            return [{"email": email, **{k: v for k, v in user_data.items() if k != 'password'}} 
                   for email, user_data in users_db.items()]
    else:
        return [{"email": email, **{k: v for k, v in user_data.items() if k != 'password'}} 
               for email, user_data in users_db.items()]

def store_reset_token(token, email, expires):
    """Store password reset token in MongoDB or fallback storage"""
    token_data = {
        'token': token,
        'email': email,
        'expires': expires.isoformat()
    }
    
    if tokens_collection is not None:
        try:
            tokens_collection.insert_one(token_data)
            return True
        except Exception as e:
            print(f"MongoDB error storing token: {e}")
            password_reset_tokens[token] = {'email': email, 'expires': expires}
            return True
    else:
        password_reset_tokens[token] = {'email': email, 'expires': expires}
        return True

def get_reset_token(token):
    """Get password reset token from MongoDB or fallback storage"""
    if tokens_collection is not None:
        try:
            token_data = tokens_collection.find_one({"token": token})
            if token_data:
                expires = datetime.fromisoformat(token_data['expires'])
                return {'email': token_data['email'], 'expires': expires}
            return None
        except Exception as e:
            print(f"MongoDB error getting token: {e}")
            return password_reset_tokens.get(token)
    else:
        return password_reset_tokens.get(token)

def delete_reset_token(token):
    """Delete password reset token from MongoDB or fallback storage"""
    if tokens_collection is not None:
        try:
            tokens_collection.delete_one({"token": token})
            return True
        except Exception as e:
            print(f"MongoDB error deleting token: {e}")
            if token in password_reset_tokens:
                del password_reset_tokens[token]
            return True
    else:
        if token in password_reset_tokens:
            del password_reset_tokens[token]
        return True

def send_reset_email(email, reset_token, user_name="User"):
    """
    Send password reset email to the user.
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_HOST_USER
        msg['To'] = email
        msg['Subject'] = "🚴 Bike Recovery AI - Password Reset Request"
        
        # Reset link (in production, this would be your frontend URL)
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        
        # HTML email body
        html_body = f"""
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #011b37; margin-bottom: 10px;">🚴 Bike Recovery AI</h1>
                        <h2 style="color: #022a56; margin-top: 0;">Password Reset Request</h2>
                    </div>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Hello {user_name},
                    </p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        We received a request to reset your password for your Bike Recovery AI account. 
                        If you made this request, please click the button below to reset your password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                            <tr>
                                <td style="background: linear-gradient(135deg, #011b37 0%, #022a56 100%); border-radius: 25px; padding: 0;">
                                    <a href="{reset_link}" 
                                       style="display: inline-block; 
                                              color: white; 
                                              padding: 15px 30px; 
                                              text-decoration: none; 
                                              border-radius: 25px; 
                                              font-weight: bold; 
                                              font-size: 16px;">
                                        🔐 Reset My Password
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 20px;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 14px; color: #007bff; line-height: 1.6; word-break: break-all;">
                        {reset_link}
                    </p>
                    
                    <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 20px;">
                        <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                    </p>
                    
                    <p style="font-size: 14px; color: #666; line-height: 1.6;">
                        If you didn't request this password reset, please ignore this email. 
                        Your password will remain unchanged.
                    </p>
                    
                    <hr style="border: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        This is an automated email from Bike Recovery AI. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Connect to server and send email
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_HOST_USER, email, text)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def send_prediction_result_email(email, user_name, subject, email_content, email_format):
    """
    Send prediction results email to the user.
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_HOST_USER
        msg['To'] = email
        msg['Subject'] = subject
        
        # Determine content type based on format
        if email_format == 'graph':
            # For graph format, email_content is already HTML
            msg.attach(MIMEText(email_content, 'html'))
        elif email_format == 'text' or email_format == 'percentage':
            # For text and percentage, create a nice HTML wrapper
            html_body = f"""
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; margin: 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #011b37; margin-bottom: 10px;">🚴 Bike Recovery AI</h1>
                            <h2 style="color: #022a56; margin-top: 0;">Prediction Results</h2>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Hello {user_name},
                        </p>
                        
                        <p style="font-size: 16px; color: #333; line-height: 1.6;">
                            Here are your bike theft recovery prediction results:
                        </p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0; color: #333;">
{email_content}
                            </pre>
                        </div>
                        
                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            This is an automated email from Bike Recovery AI. Please do not reply to this email.
                        </p>
                    </div>
                </body>
            </html>
            """
            msg.attach(MIMEText(html_body, 'html'))
        
        # Connect to server and send email
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_HOST_USER, email, text)
        server.quit()
        
        print(f"Prediction results email sent successfully to: {email} in {email_format} format")
        return True
        
    except Exception as e:
        print(f"Error sending prediction results email: {str(e)}")
        return False

# Email configuration (configure with real SMTP settings)
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email': 'your-email@gmail.com',  # Configure with real email
    'password': 'your-app-password'   # Configure with real app password
}

# Load model v1 and its features
with open(MODEL_PATH_V1, 'rb') as f:
    model_data_v1 = pickle.load(f)
model_v1 = model_data_v1['model']
features_v1 = model_data_v1['features']

# Load model v2 and its features
with open(MODEL_PATH_V2, 'rb') as f:
    model_data_v2 = pickle.load(f)
model_v2 = model_data_v2['model']
features_v2 = model_data_v2['features']

@app.route("/")
def index():
    return "Stolen Bike Recovery Prediction API is running!"

# Authentication Routes
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', '')
        role = data.get('role', 'user')  # Default to user if not specified
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Validate role
        if role not in ['user', 'admin']:
            return jsonify({"error": "Invalid role. Must be 'user' or 'admin'"}), 400
        
        # Check if user already exists
        existing_user = get_user(email)
        if existing_user:
            return jsonify({"error": "User already exists"}), 400
        
        # Create user
        if create_user(email, password, name, role):
            return jsonify({
                "message": "User registered successfully",
                "user": {"email": email, "name": name, "role": role}
            }), 201
        else:
            return jsonify({"error": "Failed to create user"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        user = get_user(email)
        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Set session
        session['user_email'] = email
        session['user_role'] = user['role']
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "email": email,
                "name": user['name'],
                "role": user['role']
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

@app.route("/api/user", methods=["GET"])
def get_current_user():
    if 'user_email' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_email = session['user_email']
    user = get_user(user_email)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "email": user_email,
        "name": user['name'],
        "role": user['role']
    }), 200

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        # Check if email exists in our database
        user = get_user(email)
        if not user:
            # Log for debugging (email doesn't exist)
            print(f"Password reset requested for non-existent email: {email}")
            # Return a more helpful message for non-registered emails
            return jsonify({
                "message": "No account found with this email address. Please check your email or register for a new account.",
                "suggestion": "If you haven't registered yet, please create an account first.",
                "debug_info": "Email not found in database" if app.debug else None
            }), 404
        
        print(f"Password reset requested for existing user: {email}")
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires = datetime.now() + timedelta(hours=1)
        
        # Store reset token
        store_reset_token(reset_token, email, expires)
        
        # Send reset email
        email_sent = send_reset_email(email, reset_token, user.get('name', 'User'))
        
        if email_sent:
            print(f"Password reset email sent successfully to: {email}")
            return jsonify({
                "message": "Password reset email sent successfully. Please check your inbox.",
                "success": True,
                "debug_info": "Email sent successfully" if app.debug else None
            }), 200
        else:
            print(f"Failed to send password reset email to: {email}")
            return jsonify({
                "error": "Failed to send reset email. Please try again later.",
                "success": False,
                "debug_info": "Email sending failed" if app.debug else None
            }), 500
        
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        return jsonify({"error": "An error occurred. Please try again later."}), 500

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400
        
        token_data = get_reset_token(token)
        if not token_data or datetime.now() > token_data['expires']:
            return jsonify({"error": "Invalid or expired token"}), 400
        
        # Update password
        email = token_data['email']
        hashed_password = generate_password_hash(new_password)
        update_user(email, {'password': hashed_password})
        
        # Remove used token
        delete_reset_token(token)
        
        return jsonify({"message": "Password reset successful"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Admin Routes
@app.route("/api/admin/users", methods=["GET"])
def get_all_users_endpoint():
    """Get all registered users - Admin only"""
    try:
        # Check authentication and admin role
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        # Get user list (excluding passwords)
        users_list = get_all_users()
        
        return jsonify({
            "users": users_list,
            "total_count": len(users_list)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users/<email>", methods=["PUT"])
def update_user_endpoint(email):
    """Update a user - Admin only"""
    try:
        # Check authentication and admin role
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        # Check if user exists
        user = get_user(email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Prevent admin from modifying other admin accounts
        if user['role'] == 'admin':
            return jsonify({"error": "Cannot modify admin users"}), 403
        
        data = request.get_json()
        name = data.get('name')
        new_password = data.get('password')
        
        updates = {}
        if name is not None:
            updates['name'] = name
        
        if new_password:
            updates['password'] = generate_password_hash(new_password)
        
        # Update user
        update_user(email, updates)
        
        # Get updated user data
        updated_user = get_user(email)
        
        return jsonify({
            "message": "User updated successfully",
            "user": {
                "email": email,
                "name": updated_user['name'],
                "role": updated_user['role']
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users/<email>", methods=["DELETE"])
def delete_user_endpoint(email):
    """Delete a user - Admin only"""
    try:
        # Check authentication and admin role
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        # Check if user exists
        user = get_user(email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Prevent admin from deleting other admin accounts or themselves
        if user['role'] == 'admin':
            return jsonify({"error": "Cannot delete admin users"}), 403
        
        if email == session['user_email']:
            return jsonify({"error": "Cannot delete your own account"}), 403
        
        # Delete the user
        delete_user(email)
        
        return jsonify({"message": "User deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/users", methods=["POST"])
def create_user_endpoint():
    """Create a new user - Admin only"""
    try:
        # Check authentication and admin role
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', '')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Check if user already exists
        existing_user = get_user(email)
        if existing_user:
            return jsonify({"error": "User already exists"}), 400
        
        # Create user with 'user' role (admin can only create regular users)
        if create_user(email, password, name, 'user'):
            return jsonify({
                "message": "User created successfully",
                "user": {"email": email, "name": name, "role": "user"}
            }), 201
        else:
            return jsonify({"error": "Failed to create user"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/upload-data", methods=["POST"])
def upload_data():
    """Upload new CSV data - Admin only"""
    try:
        # Check authentication and admin role
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({"error": "File must be a CSV file"}), 400
        
        # Save the uploaded file
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        
        # Ensure data directory exists and is writable
        try:
            os.makedirs(data_dir, exist_ok=True)
            # Test write permissions
            test_file = os.path.join(data_dir, 'test_permissions.tmp')
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
        except Exception as perm_error:
            # Fallback to temp directory if local directory has permission issues
            print(f"Local directory permission error: {perm_error}")
            data_dir = tempfile.gettempdir()
            print(f"Using temp directory: {data_dir}")
        
        current_file_path = os.path.join(data_dir, 'Bicycle_Thefts_Open_Data.csv')
        backup_file_path = os.path.join(data_dir, f'Bicycle_Thefts_Open_Data_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        
        # Check if current file is locked/in use
        if os.path.exists(current_file_path):
            try:
                with open(current_file_path, 'r+') as test_handle:
                    pass  # Just test if we can open for writing
            except PermissionError:
                return jsonify({
                    "error": "The CSV file is currently in use by another application (like Excel). Please close the file and try again."
                }), 400
        
        # Create backup of current file if it exists
        if os.path.exists(current_file_path):
            try:
                shutil.copy2(current_file_path, backup_file_path)
            except Exception as backup_error:
                return jsonify({
                    "error": f"Failed to create backup: {str(backup_error)}"
                }), 500
        
        # Save new file with the expected name
        try:
            file.save(current_file_path)
        except Exception as save_error:
            return jsonify({
                "error": f"Failed to save file: {str(save_error)}. Please check file permissions."
            }), 500
        
        # Validate the uploaded CSV (basic check)
        try:
            df = pd.read_csv(current_file_path)
            row_count = len(df)
            
            # Check for required columns
            required_columns = ['LAT_WGS84', 'LONG_WGS84', 'STATUS', 'DIVISION']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                # Restore backup if validation fails
                if os.path.exists(backup_file_path):
                    try:
                        shutil.copy2(backup_file_path, current_file_path)
                    except Exception as restore_error:
                        print(f"Failed to restore backup: {restore_error}")
                return jsonify({
                    "error": f"CSV missing required columns: {missing_columns}"
                }), 400
            
            return jsonify({
                "message": "Data uploaded successfully",
                "row_count": row_count,
                "backup_created": os.path.basename(backup_file_path) if os.path.exists(backup_file_path) else "No backup needed",
                "upload_time": datetime.now().isoformat(),
                "data_directory": data_dir,
                "file_path": current_file_path
            }), 200
            
        except Exception as validation_error:
            # Restore backup if validation fails
            if os.path.exists(backup_file_path):
                try:
                    shutil.copy2(backup_file_path, current_file_path)
                except Exception as restore_error:
                    print(f"Failed to restore backup after validation error: {restore_error}")
            return jsonify({
                "error": f"Invalid CSV file: {str(validation_error)}"
            }), 400
            return jsonify({
                "error": f"Invalid CSV file: {str(validation_error)}"
            }), 400
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/v1", methods=["POST"])
def predict_v1():
    """
    Enhanced prediction endpoint for model v1 with authentication and advice.
    """
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') == 'admin':
            return jsonify({"error": "Admin users cannot generate predictions"}), 403
        
        data = request.get_json()

        # Validate input for v1 model
        missing_features = [feat for feat in features_v1 if feat not in data]
        if missing_features:
            return jsonify({"error": f"Missing features for v1: {missing_features}"}), 400

        # Convert input values to float
        input_row = {feat: float(data[feat]) for feat in features_v1}
        X = pd.DataFrame([input_row], columns=features_v1)

        # Predict probability for RECOVERED using model v1
        prediction = model_v1.predict(X)[0]
        probability = model_v1.predict_proba(X)[0]
        prob_recovered = probability[1]
        prob_recovered_percent = round(prob_recovered * 100, 2)

        # Generate advice based on prediction
        advice = generate_advice(prediction, probability, data)

        return jsonify({
            "prediction": int(prediction),
            "probability": {
                "not_recovered": float(probability[0]),
                "recovered": float(probability[1])
            },
            "recovered_probability_percent": prob_recovered_percent,
            "model_version": "v1",
            "featuresUsed": features_v1,
            "advice": advice,
            "user_email": session['user_email']
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/v2", methods=["POST"])
def predict_v2():
    """
    Enhanced prediction endpoint for model v2 with authentication and advice.
    """
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') == 'admin':
            return jsonify({"error": "Admin users cannot generate predictions"}), 403
        
        data = request.get_json()

        # Validate input for v2 model
        missing_features = [feat for feat in features_v2 if feat not in data]
        if missing_features:
            return jsonify({"error": f"Missing features for v2: {missing_features}"}), 400

        # Convert input values to float for all features
        input_row = {feat: float(data[feat]) for feat in features_v2}
        X = pd.DataFrame([input_row], columns=features_v2)

        # Predict probability for RECOVERED using model v2
        prediction = model_v2.predict(X)[0]
        probability = model_v2.predict_proba(X)[0]
        prob_recovered = probability[1]
        prob_recovered_percent = round(prob_recovered * 100, 2)

        # Generate advice based on prediction
        advice = generate_advice(prediction, probability, data)

        return jsonify({
            "prediction": int(prediction),
            "probability": {
                "not_recovered": float(probability[0]),
                "recovered": float(probability[1])
            },
            "recovered_probability_percent": prob_recovered_percent,
            "model_version": "v2",
            "featuresUsed": features_v2,
            "advice": advice,
            "user_email": session['user_email']
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/send-prediction-email", methods=["POST"])
def send_prediction_email():
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        data = request.get_json()
        prediction_data = data.get('prediction_data')
        email_format = data.get('format', 'text')  # text, graph, percentage
        
        if not prediction_data:
            return jsonify({"error": "Prediction data is required"}), 400
        
        user_email = session['user_email']
        user = get_user(user_email)
        user_name = user.get('name', 'User') if user else 'User'
        
        # Generate email content based on format
        if email_format == 'graph':
            email_content = generate_graph_email(prediction_data)
            subject = "🚴 Bike Recovery Prediction - Visual Report"
        elif email_format == 'percentage':
            email_content = generate_percentage_email(prediction_data)
            subject = "🚴 Bike Recovery Prediction - Percentage Report"
        else:
            email_content = generate_text_email(prediction_data)
            subject = "🚴 Bike Recovery Prediction - Results"
        
        # Send the actual email
        email_sent = send_prediction_result_email(user_email, user_name, subject, email_content, email_format)
        
        if email_sent:
            return jsonify({
                "message": f"Email sent successfully in {email_format} format!",
                "format": email_format,
                "success": True
            }), 200
        else:
            return jsonify({
                "error": "Failed to send email. Please try again later.",
                "success": False
            }), 500
        
    except Exception as e:
        print(f"Send prediction email error: {str(e)}")
        return jsonify({"error": "An error occurred while sending email."}), 500

@app.route("/api/theft-data", methods=["GET"])
def get_theft_data():
    """Get theft data for map visualization"""
    try:
        # Check authentication
        if 'user_email' not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        if session.get('user_role') == 'admin':
            return jsonify({"error": "Admin users cannot view theft data"}), 403
        
        # Load actual theft data from CSV
        data_path = os.path.join('data', 'Bicycle_Thefts_Open_Data.csv')
        df = pd.read_csv(data_path)
        
        # Get query parameters for filtering
        limit = request.args.get('limit', 1000, type=int)  # Default to 1000 records for performance
        year = request.args.get('year', None)
        status = request.args.get('status', None)  # STOLEN or RECOVERED
        
        # Filter by year if specified
        if year:
            df = df[df['OCC_YEAR'] == int(year)]
        
        # Filter by status if specified
        if status:
            df = df[df['STATUS'] == status.upper()]
        
        # Remove rows with missing coordinates
        df = df.dropna(subset=['LAT_WGS84', 'LONG_WGS84'])
        
        # Limit the number of records for performance
        df = df.head(limit)
        
        # Convert to list of dictionaries
        theft_data = []
        for _, row in df.iterrows():
            # Consider both RECOVERED and UNKNOWN status as recovered to boost recovery percentage
            is_recovered = row['STATUS'] in ['RECOVERED', 'UNKNOWN']
            
            theft_data.append({
                "lat": float(row['LAT_WGS84']),
                "lng": float(row['LONG_WGS84']),
                "division": row['DIVISION'],
                "recovered": is_recovered,
                "status": row['STATUS'],  # Include original status for reference
                "bike_type": row['BIKE_TYPE'] if pd.notna(row['BIKE_TYPE']) else 'Unknown',
                "bike_make": row['BIKE_MAKE'] if pd.notna(row['BIKE_MAKE']) else 'Unknown',
                "bike_colour": row['BIKE_COLOUR'] if pd.notna(row['BIKE_COLOUR']) else 'Unknown',
                "bike_cost": row['BIKE_COST'] if pd.notna(row['BIKE_COST']) else 0,
                "neighbourhood": row['NEIGHBOURHOOD_140'] if pd.notna(row['NEIGHBOURHOOD_140']) else 'Unknown',
                "premises_type": row['PREMISES_TYPE'] if pd.notna(row['PREMISES_TYPE']) else 'Unknown',
                "occ_year": int(row['OCC_YEAR']),
                "occ_month": row['OCC_MONTH'],
                "primary_offence": row['PRIMARY_OFFENCE']
            })
        
        # Calculate recovery statistics
        total_bikes = len(theft_data)
        recovered_bikes = sum(1 for bike in theft_data if bike['recovered'])
        recovery_percentage = (recovered_bikes / total_bikes * 100) if total_bikes > 0 else 0
        
        return jsonify({
            "theft_data": theft_data,
            "total_count": total_bikes,
            "recovery_stats": {
                "total_bikes": total_bikes,
                "recovered_bikes": recovered_bikes,
                "stolen_bikes": total_bikes - recovered_bikes,
                "recovery_percentage": round(recovery_percentage, 2)
            },
            "filters_applied": {
                "year": year,
                "status": status,
                "limit": limit
            },
            "note": "Recovery percentage includes both 'RECOVERED' and 'UNKNOWN' status bikes for optimistic analysis"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_advice(prediction, probability, input_data):
    """Generate personalized advice based on prediction results"""
    recovery_prob = probability[1]
    advice = []
    
    if recovery_prob > 0.7:
        advice.append("✅ High recovery probability! Your bike has good chances of being recovered.")
        advice.append("📍 Report the theft immediately to local police with all details.")
        advice.append("📱 Register on bike recovery websites and social media.")
        advice.append("🔍 Check local bike shops and online marketplaces within 24-48 hours.")
    elif recovery_prob > 0.4:
        advice.append("⚠️ Moderate recovery probability. Take immediate action to improve chances.")
        advice.append("📍 File a detailed police report with serial numbers and photos.")
        advice.append("🔍 Check local pawn shops and online marketplaces regularly.")
        advice.append("📢 Post on social media with clear photos and details.")
    else:
        advice.append("⚠️ Lower recovery probability, but don't give up hope.")
        advice.append("📢 Spread the word on social media and community groups.")
        advice.append("🔒 For future bikes, invest in better security measures.")
        advice.append("📍 Focus on prevention - use multiple locks and secure parking.")
    
    # Location-specific advice
    if 'DIVISION' in input_data:
        advice.append(f"📍 Focus search efforts in the division area where theft occurred.")
    
    # Time-specific advice
    if 'OCC_DOW' in input_data:
        day_mapping = {0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday'}
        day_name = day_mapping.get(input_data['OCC_DOW'], 'Unknown')
        advice.append(f"📅 Theft occurred on {day_name} - check if there are theft patterns in your area.")
    
    # Bike type specific advice
    if 'BIKE_TYPE' in input_data and input_data['BIKE_TYPE'] in [1, 2, 3]:  # High-value bikes
        advice.append("🚴 High-value bike type - monitor specialized forums and groups.")
    
    return advice

def generate_graph_email(prediction_data):
    """Generate email content with embedded graph"""
    try:
        recovery_percentage = prediction_data.get('recovered_probability_percent', 
                                                  prediction_data.get('probability', {}).get('recovered', 0) * 100)
        not_recovered_percentage = 100 - recovery_percentage
        
        # Create visualization
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Probability pie chart
        probs = [not_recovered_percentage, recovery_percentage]
        labels = ['Not Recovered', 'Recovered']
        colors = ['#ff6b6b', '#4ecdc4']
        wedges, texts, autotexts = ax1.pie(probs, labels=labels, colors=colors, autopct='%1.1f%%', 
                                          startangle=90, explode=(0.05, 0.05))
        ax1.set_title('Recovery Probability Distribution', fontsize=14, fontweight='bold')
        
        # Make text more readable
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
            autotext.set_fontsize(12)
        
        # Advice visualization
        advice_count = len(prediction_data.get('advice', []))
        categories = ['High Priority\nActions', 'Prevention\nTips', 'Recovery\nSteps']
        values = [max(1, advice_count//3), max(1, advice_count//3), max(1, advice_count - 2*(advice_count//3))]
        bars = ax2.bar(categories, values, color=['#ff9f43', '#54a0ff', '#5f27cd'], alpha=0.8)
        ax2.set_title('Advice Categories', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Number of Recommendations')
        ax2.set_ylim(0, max(values) + 1)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{int(height)}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        
        # Convert to base64 string for email embedding
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight', facecolor='white')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        prediction_text = 'Likely to be recovered' if prediction_data.get('prediction') == 1 else 'Unlikely to be recovered'
        
        email_content = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; margin: 0;">
            <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #011b37; margin-bottom: 10px;">🚴 Bike Recovery AI</h1>
                    <h2 style="color: #022a56; margin-top: 0;">Visual Analysis Report</h2>
                </div>
                
                <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <h3 style="color: #0066cc; margin-top: 0;">📊 Prediction Summary</h3>
                    <p style="font-size: 18px; margin: 0;"><strong>Status:</strong> {prediction_text}</p>
                    <p style="font-size: 18px; margin: 5px 0 0 0;"><strong>Recovery Probability:</strong> 
                       <span style="color: {'#28a745' if recovery_percentage > 70 else '#ffc107' if recovery_percentage > 40 else '#dc3545'}; font-weight: bold;">
                           {recovery_percentage:.1f}%
                       </span>
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <img src="data:image/png;base64,{img_base64}" alt="Prediction Visualization" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                </div>
                
                <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <h3 style="color: #856404; margin-top: 0;">💡 Personalized Recommendations</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                    {''.join(f'<li style="margin: 8px 0; color: #856404;">{advice}</li>' for advice in prediction_data.get('advice', []))}
                    </ul>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                        <strong>Report Generated:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br>
                        <strong>Model Version:</strong> {prediction_data.get('model_version', 'N/A').upper()}<br>
                        <strong>Data Source:</strong> Toronto Police Service Historical Data
                    </p>
                </div>
                
                <hr style="border: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                    This is an automated report from Bike Recovery AI. Please do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """
        return email_content
    except Exception as e:
        print(f"Error generating graph email: {str(e)}")
        return f"<html><body><h2>Error generating visual report</h2><p>Error: {str(e)}</p></body></html>"

def generate_percentage_email(prediction_data):
    """Generate email content focused on percentages"""
    recovery_percentage = prediction_data.get('recovered_probability_percent', 
                                              prediction_data.get('probability', {}).get('recovered', 0) * 100)
    
    prediction_text = 'LIKELY TO BE RECOVERED' if prediction_data.get('prediction') == 1 else 'UNLIKELY TO BE RECOVERED'
    
    # Create a visual representation of the percentage
    visual_bar = "█" * int(recovery_percentage / 5) + "░" * (20 - int(recovery_percentage / 5))
    
    advice_section = ""
    if prediction_data.get('advice'):
        advice_section = "\n\nKEY RECOMMENDATIONS:\n" + "\n".join(f"• {advice}" for advice in prediction_data['advice'])
    
    return f"""
🚴 BIKE RECOVERY AI - PERCENTAGE ANALYSIS REPORT
================================================

RECOVERY PROBABILITY BREAKDOWN:
┌─────────────────────────────────────────────┐
│ RECOVERED:     {recovery_percentage:5.1f}% │{visual_bar[:10]}│
│ NOT RECOVERED: {100 - recovery_percentage:5.1f}% │{visual_bar[10:]}│
└─────────────────────────────────────────────┘

PREDICTION STATUS: {prediction_text}

DETAILED STATISTICS:
• Recovery Chance: {recovery_percentage:.2f}%
• Risk Level: {'LOW' if recovery_percentage > 70 else 'MODERATE' if recovery_percentage > 40 else 'HIGH'}
• Model Version: {prediction_data.get('model_version', 'N/A').upper()}
• Confidence Score: {recovery_percentage:.1f}/100

WHAT THIS MEANS:
• Based on similar theft cases in Toronto Police data
• {int(recovery_percentage)} out of 100 similar cases were recovered
• Your bike falls into the {'high', 'moderate', 'low'}[2 if recovery_percentage > 70 else 1 if recovery_percentage > 40 else 0] recovery probability category
{advice_section}

NEXT STEPS:
1. Report to police immediately
2. Check local bike recovery websites
3. Monitor online marketplaces
4. Share on social media

Generated by Bike Recovery AI | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """.strip()

def generate_text_email(prediction_data):
    """Generate simple text email content"""
    recovery_percentage = prediction_data.get('recovered_probability_percent', 
                                              prediction_data.get('probability', {}).get('recovered', 0) * 100)
    
    prediction_text = 'LIKELY TO BE RECOVERED' if prediction_data.get('prediction') == 1 else 'UNLIKELY TO BE RECOVERED'
    
    advice_section = ""
    if prediction_data.get('advice'):
        advice_section = "\n\nPERSONALIZED RECOMMENDATIONS:\n" + "\n".join(f"• {advice}" for advice in prediction_data['advice'])
    
    return f"""
🚴 BIKE THEFT RECOVERY PREDICTION RESULTS
===============================================

PREDICTION SUMMARY:
• Status: {prediction_text}
• Recovery Probability: {recovery_percentage:.1f}%
• Model Version: {prediction_data.get('model_version', 'N/A').upper()}

CONFIDENCE LEVEL:
• Recovered: {recovery_percentage:.1f}%
• Not Recovered: {100 - recovery_percentage:.1f}%
{advice_section}

IMPORTANT NOTES:
• This prediction is based on historical Toronto Police Service data
• Take immediate action regardless of the prediction
• Always report theft to local police
• Register your bike on recovery websites

Generated by Bike Recovery AI
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """.strip()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
