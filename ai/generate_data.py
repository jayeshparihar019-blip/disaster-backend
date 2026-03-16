import pandas as pd
import numpy as np
import os
import random

def generate_climate_data(num_records=1000):
    np.random.seed(42)
    random.seed(42)

    data = []
    regions = ['Assam', 'Maharashtra', 'Delhi', 'Gujarat', 'Kerala', 'Odisha', 'West Bengal']
    disaster_types = ['None', 'Flood', 'Cyclone', 'Heatwave', 'Drought', 'Earthquake']

    for _ in range(num_records):
        temp = np.round(np.random.normal(30, 8), 1)
        rainfall = np.round(np.random.exponential(50), 1)
        humidity = np.round(np.random.uniform(20, 100), 1)
        wind_speed = np.round(np.random.normal(15, 10), 1)
        soil_moisture = np.round(np.random.uniform(10, 90), 1)
        river_level = np.round(np.random.uniform(1, 15), 1)
        pressure = np.round(np.random.normal(1010, 10), 1)
        region = random.choice(regions)

        # Basic logic to assign disaster risk
        disaster = 'None'
        if rainfall > 150 and river_level > 8:
            disaster = 'Flood'
        elif wind_speed > 60 and pressure < 990:
            disaster = 'Cyclone'
        elif temp > 40 and humidity < 30:
            disaster = 'Heatwave'
        elif rainfall < 10 and temp > 35:
            disaster = 'Drought'
        
        # Noise
        if random.random() < 0.05:
            disaster = random.choice(disaster_types)
            
        data.append([
            temp, rainfall, humidity, wind_speed, soil_moisture, 
            river_level, pressure, region, disaster
        ])

    df = pd.DataFrame(data, columns=[
        'temperature', 'rainfall', 'humidity', 'wind_speed', 
        'soil_moisture', 'river_level', 'pressure', 'region', 'disaster_type'
    ])
    
    # Save to dataset folder
    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'dataset')
    os.makedirs(dataset_dir, exist_ok=True)
    
    file_path = os.path.join(dataset_dir, 'climate_data.csv')
    df.to_csv(file_path, index=False)
    print(f"Generated {num_records} records of synthetic climate data at {file_path}")

if __name__ == "__main__":
    generate_climate_data()
