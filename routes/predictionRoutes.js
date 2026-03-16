import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const aiDir = path.join(__dirname, '../ai');
const scriptPath = path.join(aiDir, 'predict.py');

let riskTrendData = [];
let currentAlert = { alert: false, message: "", risk_level: "Low" };

function calculateMockPrediction(data) {
    let risk = 0.1, disaster = "None";
    if (data.rainfall > 150 && data.river_level > 8) { risk = Math.min(1.0, 0.6 + (data.rainfall - 150) / 500); disaster = "Flood"; }
    else if (data.wind_speed > 60 && data.pressure < 990) { risk = Math.min(1.0, 0.6 + (data.wind_speed - 60) / 100); disaster = "Cyclone"; }
    else if (data.temperature > 40 && data.humidity < 30) { risk = Math.min(1.0, 0.6 + (data.temperature - 40) / 20); disaster = "Heatwave"; }
    else { risk = 0.1 + Math.random() * 0.2; }
    return { predicted_disaster: disaster, risk_probability: parseFloat(risk.toFixed(2)), risk_level: risk < 0.3 ? "Low" : risk < 0.6 ? "Medium" : "High" };
}

// Seed trend data immediately so graph shows on first page load
function seedRiskTrend() {
    const times = ["08:00","10:00","12:00","14:00","16:00","18:00","20:00"];
    let f = 0.3, c = 0.15, h = 0.1;
    riskTrendData = times.map(time => {
        f = Math.max(0, Math.min(1, f + (Math.random() - 0.4) * 0.10));
        c = Math.max(0, Math.min(1, c + (Math.random() - 0.5) * 0.06));
        h = Math.max(0, Math.min(1, h + (Math.random() - 0.5) * 0.05));
        return { time, flood: f, cyclone: c, heatwave: h };
    });
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    riskTrendData.push({ time: nowStr, flood: f, cyclone: c, heatwave: h });
}
seedRiskTrend();

// Regional knowledge base — disaster probabilities per city/region
const REGIONAL_DATA = {
    "Assam":         { flood:0.88, cyclone:0.22, landslide:0.45, earthquake:0.30, heatwave:0.12, drought:0.05 },
    "Mumbai":        { flood:0.75, cyclone:0.58, landslide:0.15, earthquake:0.20, heatwave:0.35, drought:0.10 },
    "Jaipur":        { flood:0.35, cyclone:0.18, landslide:0.08, earthquake:0.25, heatwave:0.82, drought:0.70 },
    "Chennai":       { flood:0.62, cyclone:0.71, landslide:0.20, earthquake:0.18, heatwave:0.55, drought:0.30 },
    "Kolkata":       { flood:0.78, cyclone:0.65, landslide:0.25, earthquake:0.15, heatwave:0.40, drought:0.15 },
    "Uttarkashi":    { flood:0.40, cyclone:0.05, landslide:0.78, earthquake:0.68, heatwave:0.15, drought:0.10 },
    "Visakhapatnam": { flood:0.60, cyclone:0.80, landslide:0.22, earthquake:0.20, heatwave:0.45, drought:0.18 },
    "Latur":         { flood:0.28, cyclone:0.08, landslide:0.15, earthquake:0.88, heatwave:0.50, drought:0.40 },
    "Patna":         { flood:0.82, cyclone:0.30, landslide:0.20, earthquake:0.22, heatwave:0.45, drought:0.20 },
    "Kozhikode":     { flood:0.55, cyclone:0.40, landslide:0.72, earthquake:0.25, heatwave:0.20, drought:0.15 },
    "Surat":         { flood:0.50, cyclone:0.35, landslide:0.10, earthquake:0.18, heatwave:0.65, drought:0.30 },
    "Imphal":        { flood:0.45, cyclone:0.15, landslide:0.55, earthquake:0.75, heatwave:0.12, drought:0.08 },
    "Delhi":         { flood:0.38, cyclone:0.05, landslide:0.05, earthquake:0.30, heatwave:0.78, drought:0.50 },
    "default":       { flood:0.40, cyclone:0.25, landslide:0.20, earthquake:0.20, heatwave:0.30, drought:0.20 },
};

// 1. Climate risk prediction (POST)
router.post('/predict-climate-risk', (req, res) => {
    const inputData = req.body;
    const str = JSON.stringify(inputData).replace(/"/g, '\\"');
    exec(`python "${scriptPath}" "${str}"`, (error, stdout) => {
        if (error) return res.json(calculateMockPrediction(inputData));
        try { res.json(JSON.parse(stdout)); } catch { res.json(calculateMockPrediction(inputData)); }
    });
});

// 2. Risk trend (line graph data)
router.get('/risk-trend', (req, res) => {
    if (riskTrendData.length === 0) seedRiskTrend();
    res.json(riskTrendData);
});

// 3. Risk heatmap (lat/lng/intensity points)
router.get('/risk-heatmap', (req, res) => {
    res.json([
        { lat: 26.9124, lng: 75.7873, risk: 0.82 },
        { lat: 28.7041, lng: 77.1025, risk: 0.55 },
        { lat: 19.0760, lng: 72.8777, risk: 0.34 },
        { lat: 22.5726, lng: 88.3639, risk: 0.75 },
        { lat: 13.0827, lng: 80.2707, risk: 0.60 },
        { lat: 26.1445, lng: 91.7362, risk: 0.90 },
        { lat: 20.2961, lng: 85.8245, risk: 0.85 },
        { lat: 30.7268, lng: 78.4354, risk: 0.65 },
        { lat: 25.5941, lng: 85.1376, risk: 0.78 },
        { lat: 17.6868, lng: 83.2185, risk: 0.72 },
        { lat: 18.4088, lng: 76.5604, risk: 0.88 },
        { lat: 24.8170, lng: 93.9368, risk: 0.62 },
    ]);
});

// 4. AI early warning alerts
router.get('/ai-alerts', (req, res) => res.json(currentAlert));

// 5. Regional disaster prediction
router.get('/regional-prediction', (req, res) => {
    const region = (req.query.region || 'default').trim();
    const key = Object.keys(REGIONAL_DATA).find(k =>
        k.toLowerCase() === region.toLowerCase() ||
        region.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(region.toLowerCase())
    ) || 'default';
    const base = REGIONAL_DATA[key];
    const predictions = {};
    Object.entries(base).forEach(([type, val]) => {
        predictions[type] = Math.max(0.02, Math.min(0.99,
            parseFloat((val + (Math.random() - 0.5) * 0.04).toFixed(2))
        ));
    });
    res.json({ region: key === 'default' ? region : key, predictions });
});

// 6. Cyclone path tracking
router.get('/cyclone-path', (req, res) => {
    res.json({
        name: "Cyclone Biparjoy",
        category: "Severe Cyclonic Storm",
        windSpeed: "120 km/h",
        pressure: "972 hPa",
        path: [
            { lat: 10.5, lng: 88.0, label: "Origin (2 days ago)" },
            { lat: 12.2, lng: 87.5, label: "24h ago" },
            { lat: 14.0, lng: 87.0, label: "12h ago" },
            { lat: 15.8, lng: 86.5, label: "6h ago" },
            { lat: 17.6, lng: 85.8, label: "Current Position" },
        ],
        forecast: [
            { lat: 19.2, lng: 85.0, label: "6h Forecast" },
            { lat: 20.2, lng: 84.5, label: "12h Forecast" },
            { lat: 20.9, lng: 84.8, label: "Landfall (Odisha)" },
        ]
    });
});

// 7. Flood risk zones
router.get('/flood-risk-zones', (req, res) => {
    res.json([
        { lat: 26.14, lng: 91.74, risk: 0.92, region: "Assam" },
        { lat: 25.59, lng: 85.14, risk: 0.85, region: "Patna, Bihar" },
        { lat: 22.57, lng: 88.36, risk: 0.78, region: "Kolkata" },
        { lat: 20.30, lng: 85.82, risk: 0.82, region: "Odisha" },
        { lat: 19.08, lng: 72.88, risk: 0.70, region: "Mumbai" },
        { lat: 13.08, lng: 80.27, risk: 0.65, region: "Chennai" },
        { lat: 26.85, lng: 80.95, risk: 0.60, region: "Lucknow" },
        { lat: 27.18, lng: 78.01, risk: 0.55, region: "Agra" },
        { lat: 17.38, lng: 78.49, risk: 0.62, region: "Hyderabad" },
    ]);
});

// Background 10-min update
setInterval(() => {
    const now = new Date();
    const t = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const last = riskTrendData[riskTrendData.length - 1] || { flood:0.3, cyclone:0.1, heatwave:0.1 };
    const f = Math.max(0, Math.min(1, last.flood    + (Math.random() - 0.4) * 0.15));
    const c = Math.max(0, Math.min(1, last.cyclone  + (Math.random() - 0.5) * 0.05));
    const h = Math.max(0, Math.min(1, last.heatwave + (Math.random() - 0.5) * 0.05));
    riskTrendData.push({ time: t, flood: f, cyclone: c, heatwave: h });
    if (riskTrendData.length > 12) riskTrendData.shift();
    const maxRisk = Math.max(f, c, h);
    if (maxRisk > 0.7) {
        const disaster = c > f ? "Cyclone" : h > f ? "Heatwave" : "Flood";
        currentAlert = { alert: true, message: `High ${disaster} Risk predicted in vulnerable regions within next 24 hours.`, risk_level: "High", disaster };
    } else {
        currentAlert = { alert: false, message: "", risk_level: "Low", disaster: "None" };
    }
}, 10 * 60 * 1000);

export default router;
