import sys
import json
import pickle
import os
import numpy as np

def predict_disaster_risk(input_data):
    ai_dir = os.path.dirname(__file__)
    model_path = os.path.join(ai_dir, 'climate_disaster_model.pkl')
    
    if not os.path.exists(model_path):
        return json.dumps({"error": "Model file not found. Please train the model first."})
        
    with open(model_path, 'rb') as f:
        saved_data = pickle.load(f)
        
    model = saved_data['model']
    scaler = saved_data['scaler']
    label_encoders = saved_data['label_encoders']
    
    try:
        data = json.loads(input_data)
        
        # Extract features in the exact order they were trained on
        # ['temperature', 'rainfall', 'humidity', 'wind_speed', 'soil_moisture', 'river_level', 'pressure']
        features = [
            data.get('temperature', 0),
            data.get('rainfall', 0),
            data.get('humidity', 0),
            data.get('wind_speed', 0),
            data.get('soil_moisture', 0),
            data.get('river_level', 0),
            data.get('pressure', 1010) # default pressure if not provided
        ]
        
        # Scale features
        features_scaled = scaler.transform([features])
        
        # Output probabilities and prediction
        probabilities = model.predict_proba(features_scaled)[0]
        prediction_idx = model.predict(features_scaled)[0]
        
        disaster_type = label_encoders['disaster_type'].inverse_transform([prediction_idx])[0]
        max_prob = float(np.max(probabilities))
        
        # If 'None' was predicted, find the highest probability of an actual disaster
        # to calculate a general "risk probability"
        risk_probability = max_prob
        if disaster_type == 'None':
            # Identify the second highest prob
            none_idx = label_encoders['disaster_type'].transform(['None'])[0]
            probs_without_none = np.delete(probabilities, none_idx)
            if len(probs_without_none) > 0:
                risk_probability = float(np.max(probs_without_none))
                # Optionally change predicted_disaster to the highest non-None if risk > 0.3
                if risk_probability > 0.3:
                    highest_non_none_idx = np.where(probabilities == risk_probability)[0][0]
                    disaster_type = label_encoders['disaster_type'].inverse_transform([highest_non_none_idx])[0]
            else:
                risk_probability = 0.0
                
        # Calculate Risk Level
        if risk_probability < 0.3:
            risk_level = "Low"
        elif risk_probability < 0.6:
            risk_level = "Medium"
        else:
            risk_level = "High"
            
        result = {
            "predicted_disaster": disaster_type,
            "risk_probability": round(risk_probability, 2),
            "risk_level": risk_level
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_json = sys.argv[1]
        predict_disaster_risk(input_json)
    else:
        print(json.dumps({"error": "No input data provided."}))
