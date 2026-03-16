import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import os

def train_and_save_model():
    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'dataset')
    file_path = os.path.join(dataset_dir, 'climate_data.csv')
    
    if not os.path.exists(file_path):
        print(f"Dataset not found at {file_path}. Please run generate_data.py first.")
        return

    # Load dataset
    df = pd.read_csv(file_path)

    # 1. Preprocessing
    # Remove missing values
    df.dropna(inplace=True)

    # Encode categorical variables
    label_encoders = {}
    for col in ['region', 'disaster_type']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    # Features and Target
    X = df.drop(columns=['disaster_type', 'region']) # For simplicity, we predict purely based on weather metrics in the predict.py example
    y = df['disaster_type']

    # Normalize numerical columns
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # 2. Train Model
    print("Training RandomForestClassifier model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 3. Evaluate Accuracy
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model trained successfully. Accuracy: {accuracy * 100:.2f}%")

    # 4. Save Model and Encoders
    ai_dir = os.path.dirname(__file__)
    model_path = os.path.join(ai_dir, 'climate_disaster_model.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'scaler': scaler,
            'label_encoders': label_encoders
        }, f)
        
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
