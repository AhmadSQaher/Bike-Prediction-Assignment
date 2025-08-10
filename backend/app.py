import os
import pickle
import pandas as pd
import json
import smtplib
import secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64

# Define model file paths for v1 and v2
MODEL_PATH_V1 = os.path.join('models', 'stolen_bike_recovery_prediction_model_v1.pkl')
MODEL_PATH_V2 = os.path.join('models', 'stolen_bike_recovery_prediction_model_v2.pkl')

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'  # Change in production
CORS(app, supports_credentials=True)  # Enable CORS for frontend with credentials

# In-memory storage for demo (use database in production)
users_db = {}
password_reset_tokens = {}

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
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        if email in users_db:
            return jsonify({"error": "User already exists"}), 400
        
        # Hash password and store user
        hashed_password = generate_password_hash(password)
        users_db[email] = {
            'password': hashed_password,
            'name': name,
            'role': 'user',  # default role
            'created_at': datetime.now().isoformat()
        }
        
        return jsonify({
            "message": "User registered successfully",
            "user": {"email": email, "name": name, "role": "user"}
        }), 201
        
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
        
        user = users_db.get(email)
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
    user = users_db.get(user_email)
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
        
        if email not in users_db:
            return jsonify({"error": "User not found"}), 404
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        password_reset_tokens[reset_token] = {
            'email': email,
            'expires': datetime.now() + timedelta(hours=1)
        }
        
        # In a real application, send email here
        # send_reset_email(email, reset_token)
        
        return jsonify({
            "message": "Password reset token generated",
            "reset_token": reset_token  # In production, don't return this
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400
        
        token_data = password_reset_tokens.get(token)
        if not token_data or datetime.now() > token_data['expires']:
            return jsonify({"error": "Invalid or expired token"}), 400
        
        # Update password
        email = token_data['email']
        users_db[email]['password'] = generate_password_hash(new_password)
        
        # Remove used token
        del password_reset_tokens[token]
        
        return jsonify({"message": "Password reset successful"}), 200
        
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
        
        # Generate email content based on format
        if email_format == 'graph':
            email_content = generate_graph_email(prediction_data)
        elif email_format == 'percentage':
            email_content = generate_percentage_email(prediction_data)
        else:
            email_content = generate_text_email(prediction_data)
        
        # In a real application, send the email here
        # send_email(user_email, "Bike Theft Recovery Prediction Results", email_content)
        
        return jsonify({
            "message": "Email sent successfully",
            "format": email_format,
            "preview": email_content[:200] + "..." if len(email_content) > 200 else email_content
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
            theft_data.append({
                "lat": float(row['LAT_WGS84']),
                "lng": float(row['LONG_WGS84']),
                "division": row['DIVISION'],
                "recovered": row['STATUS'] == 'RECOVERED',
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
        
        return jsonify({
            "theft_data": theft_data,
            "total_count": len(theft_data),
            "filters_applied": {
                "year": year,
                "status": status,
                "limit": limit
            }
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
        # Create visualization
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Probability pie chart
        probs = [prediction_data['probability']['not_recovered'], prediction_data['probability']['recovered']]
        labels = ['Not Recovered', 'Recovered']
        colors = ['#ff6b6b', '#4ecdc4']
        ax1.pie(probs, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax1.set_title('Recovery Probability')
        
        # Advice visualization
        advice_count = len(prediction_data.get('advice', []))
        categories = ['Security Tips', 'Action Items', 'General Advice']
        values = [advice_count//3, advice_count//3, advice_count - 2*(advice_count//3)]
        ax2.bar(categories, values, color=['#ff9f43', '#54a0ff', '#5f27cd'])
        ax2.set_title('Advice Categories')
        ax2.set_ylabel('Number of Tips')
        
        plt.tight_layout()
        
        # Convert to base64 string for email embedding
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        email_content = f"""
        <html>
        <body>
            <h2>Bike Theft Recovery Prediction Results</h2>
            <p><strong>Prediction:</strong> {'Likely to be recovered' if prediction_data['prediction'] == 1 else 'Unlikely to be recovered'}</p>
            <p><strong>Recovery Probability:</strong> {prediction_data['probability']['recovered']:.1%}</p>
            
            <img src="data:image/png;base64,{img_base64}" alt="Prediction Visualization" style="max-width: 100%; height: auto;">
            
            <h3>Personalized Advice:</h3>
            <ul>
            {''.join(f'<li>{advice}</li>' for advice in prediction_data.get('advice', []))}
            </ul>
            
            <p><em>Generated by Bike Theft Prediction System</em></p>
        </body>
        </html>
        """
        return email_content
    except Exception as e:
        return f"Error generating graph email: {str(e)}"

def generate_percentage_email(prediction_data):
    """Generate email content focused on percentages"""
    recovery_percentage = prediction_data['probability']['recovered'] * 100
    
    return f"""
    Bike Theft Recovery Prediction Results
    ====================================
    
    Recovery Probability: {recovery_percentage:.1f}%
    Not Recovered Probability: {100 - recovery_percentage:.1f}%
    
    Prediction: {'LIKELY TO BE RECOVERED' if prediction_data['prediction'] == 1 else 'UNLIKELY TO BE RECOVERED'}
    
    Model Version: {prediction_data['model_version'].upper()}
    
    Key Recommendations:
    {chr(10).join(f'• {advice}' for advice in prediction_data.get('advice', []))}
    
    Generated by Bike Theft Prediction System
    """

def generate_text_email(prediction_data):
    """Generate simple text email content"""
    return f"""
    Dear User,
    
    Your bike theft recovery prediction has been completed.
    
    Result: {'Your bike is likely to be recovered' if prediction_data['prediction'] == 1 else 'Your bike is unlikely to be recovered'}
    Confidence: {prediction_data['probability']['recovered']:.1%}
    
    Personalized Advice:
    {chr(10).join(f'- {advice}' for advice in prediction_data.get('advice', []))}
    
    Best regards,
    Bike Theft Prediction Team
    """

if __name__ == "__main__":
    app.run(debug=True, port=5000)
