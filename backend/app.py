import os
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Define model file paths for v1 and v2
MODEL_PATH_V1 = os.path.join('models', 'stolen_bike_recovery_prediction_model_v1.pkl')
MODEL_PATH_V2 = os.path.join('models', 'stolen_bike_recovery_prediction_model_v2.pkl')

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

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

@app.route("/predict/v1", methods=["POST"])
def predict_v1():
    """
    Prediction endpoint for model v1.
    Converts incoming values to floats and then builds a DataFrame using v1 features.
    """
    try:
        data = request.get_json()

        # Validate input for v1 model
        missing_features = [feat for feat in features_v1 if feat not in data]
        if missing_features:
            return jsonify({"error": f"Missing features for v1: {missing_features}"}), 400

        # Convert input values to float
        input_row = {feat: float(data[feat]) for feat in features_v1}
        X = pd.DataFrame([input_row], columns=features_v1)

        # Predict probability for RECOVERED using model v1
        prob_recovered = model_v1.predict_proba(X)[0][1]
        prob_recovered_percent = round(prob_recovered * 100, 2)

        return jsonify({
            "recovered_probability_percent": prob_recovered_percent,
            "model_version": "v1",
            "featuresUsed": features_v1
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/v2", methods=["POST"])
def predict_v2():
    """
    Prediction endpoint for model v2.
    Converts incoming values to float to ensure correct numeric types.
    """
    try:
        data = request.get_json()

        # Validate input for v2 model
        missing_features = [feat for feat in features_v2 if feat not in data]
        if missing_features:
            return jsonify({"error": f"Missing features for v2: {missing_features}"}), 400

        # Convert input values to float for all features
        input_row = {feat: float(data[feat]) for feat in features_v2}
        X = pd.DataFrame([input_row], columns=features_v2)

        # Predict probability for RECOVERED using model v2
        prob_recovered = model_v2.predict_proba(X)[0][1]
        prob_recovered_percent = round(prob_recovered * 100, 2)

        return jsonify({
            "recovered_probability_percent": prob_recovered_percent,
            "model_version": "v2",
            "featuresUsed": features_v2
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
