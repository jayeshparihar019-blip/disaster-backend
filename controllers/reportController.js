import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, '../data/reports.json');

// ─── Location → Coordinates Lookup ──────────────────────────────────────────
const LOCATION_COORDS = {
  // Major cities
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'jodhpur': { lat: 26.2389, lng: 73.0243 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'vizag': { lat: 17.6868, lng: 83.2185 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'amritsar': { lat: 31.6340, lng: 74.8723 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'latur': { lat: 18.4088, lng: 76.5604 },
  'uttarkashi': { lat: 30.7268, lng: 78.4354 },
  'kozhikode': { lat: 11.2588, lng: 75.7804 },
  'calicut': { lat: 11.2588, lng: 75.7804 },
  'imphal': { lat: 24.8170, lng: 93.9368 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'cochin': { lat: 9.9312, lng: 76.2673 },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },
  'shillong': { lat: 25.5788, lng: 91.8933 },
  'dehradun': { lat: 30.3165, lng: 78.0322 },
  'shimla': { lat: 31.1048, lng: 77.1734 },
  'jammu': { lat: 32.7266, lng: 74.8570 },
  'srinagar': { lat: 34.0837, lng: 74.7973 },
  'rajasthan': { lat: 27.0238, lng: 74.2179 },
  'maharashtra': { lat: 19.7515, lng: 75.7139 },
  'gujarat': { lat: 22.2587, lng: 71.1924 },
  'kerala': { lat: 10.8505, lng: 76.2711 },
  'karnataka': { lat: 15.3173, lng: 75.7139 },
  'tamilnadu': { lat: 11.1271, lng: 78.6569 },
  'tamil nadu': { lat: 11.1271, lng: 78.6569 },
  'andhra': { lat: 15.9129, lng: 79.7400 },
  'telangana': { lat: 18.1124, lng: 79.0193 },
  'odisha': { lat: 20.9517, lng: 85.0985 },
  'bihar': { lat: 25.0961, lng: 85.3131 },
  'jharkhand': { lat: 23.6102, lng: 85.2799 },
  'uttarakhand': { lat: 30.0668, lng: 79.0193 },
  'himachal': { lat: 31.1048, lng: 77.1734 },
  'punjab': { lat: 31.1471, lng: 75.3412 },
  'haryana': { lat: 29.0588, lng: 76.0856 },
  'andheri': { lat: 19.1136, lng: 72.8697 },
  // Northeast India
  'assam': { lat: 26.2006, lng: 92.9376 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },
  'silchar': { lat: 24.8333, lng: 92.7789 },
  'dibrugarh': { lat: 27.4728, lng: 94.9120 },
  'jorhat': { lat: 26.7509, lng: 94.2037 },
  'nagaland': { lat: 26.1584, lng: 94.5624 },
  'kohima': { lat: 25.6747, lng: 94.1086 },
  'arunachal': { lat: 28.2180, lng: 94.7278 },
  'itanagar': { lat: 27.0844, lng: 93.6053 },
  'manipur': { lat: 24.6637, lng: 93.9063 },
  'meghalaya': { lat: 25.4670, lng: 91.3662 },
  'mizoram': { lat: 23.1645, lng: 92.9376 },
  'sikkim': { lat: 27.5330, lng: 88.5122 },
  'tripura': { lat: 23.9408, lng: 91.9882 },
  'agartala': { lat: 23.8315, lng: 91.2868 },
  // Other major cities
  'mysuru': { lat: 12.2958, lng: 76.6394 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'hubli': { lat: 15.3647, lng: 75.1240 },
  'mangalore': { lat: 12.9141, lng: 74.8560 },
  'vijayawada': { lat: 16.5062, lng: 80.6480 },
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'madurai': { lat: 9.9252, lng: 78.1198 },
  'salem': { lat: 11.6643, lng: 78.1460 },
  'rajkot': { lat: 22.3039, lng: 70.8022 },
  'jamshedpur': { lat: 22.8046, lng: 86.2029 },
  'dhanbad': { lat: 23.7957, lng: 86.4304 },
  'cuttack': { lat: 20.4625, lng: 85.8828 },
  'raipur': { lat: 21.2514, lng: 81.6296 },
  'chhattisgarh': { lat: 21.2787, lng: 81.8661 },
};

export const getCoordinates = (locationStr) => {
  if (!locationStr) return { lat: 20.5937, lng: 78.9629 }; // Default: Center of India

  const lower = locationStr.toLowerCase();

  // Try matching each key
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) {
      return coords;
    }
  }

  // Default fallback: Center of India
  return { lat: 20.5937, lng: 78.9629 };
};

// ─── File Helpers ──────────────────────────────────────────────────────────
const readData = () => {
  if (!fs.existsSync(dataFile)) return [];
  const data = fs.readFileSync(dataFile);
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// ─── Controllers ───────────────────────────────────────────────────────────
export const createReport = (req, res) => {
  const reports = readData();
  const timestamp = new Date();

  const formatTime = (date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date) => date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const coords = getCoordinates(req.body.location);

  const AI_PRIORITY_MAP = {
    High:   { Flood:'CRITICAL', Earthquake:'CRITICAL', Cyclone:'CRITICAL', Tsunami:'CRITICAL', Fire:'HIGH', Landslide:'HIGH', 'Industrial Accident':'HIGH' },
    Medium: { Flood:'HIGH', Earthquake:'HIGH', Cyclone:'HIGH', Fire:'MEDIUM', Landslide:'MEDIUM', Tsunami:'CRITICAL', 'Industrial Accident':'MEDIUM' },
    Low:    { Flood:'LOW', Earthquake:'MEDIUM', Cyclone:'MEDIUM', Fire:'LOW', Landslide:'LOW', Tsunami:'HIGH', 'Industrial Accident':'LOW' },
  };
  const aiLabel = (AI_PRIORITY_MAP[req.body.severity] || {})[req.body.type] || 'MEDIUM';

  // ── File URLs from multer ────────────────────────────────────────────────
  const files = req.files || {};
  const audioUrl = files.audioFile?.[0]
    ? `/uploads/audio/${files.audioFile[0].filename}` : null;
  const videoUrl = files.videoFile?.[0]
    ? `/uploads/videos/${files.videoFile[0].filename}` : null;
  const imageUrl = files.image?.[0]
    ? `/uploads/images/${files.image[0].filename}` : null;

  const report = {
    id: Date.now().toString(),
    ...req.body,
    lat: coords.lat,
    lng: coords.lng,
    timestamp: timestamp.toISOString(),
    time: formatTime(timestamp),
    date: formatDate(timestamp),
    status: 'pending',
    aiPriorityLabel: aiLabel,
    audioUrl,
    videoUrl,
    imageUrl,
    transcription: req.body.transcription || null,
  };

  reports.push(report);
  writeData(reports);

  res.json({
    message: 'Report saved successfully',
    reportId: report.id,
    aiPriorityLabel: aiLabel,
    smsSent: false,
    audioUrl,
    videoUrl,
    imageUrl,
  });
};


export const getReports = (req, res) => {
  const reports = readData();

  // PUBLIC endpoint — only return reports that an admin has verified
  // pending and resolved reports are hidden from the public dashboard
  const visible = reports
    .filter(r => r.status === 'verified' || r.status === 'under_response')
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  res.json(visible);
};

export const getMapData = (req, res) => {
  const reports = readData();

  // PUBLIC map — only show verified or under_response reports
  // pending (unverified) and resolved reports do NOT appear on the public map
  const mapReady = reports
    .filter(r => r.lat && r.lng && (r.status === 'verified' || r.status === 'under_response'))
    .map(r => ({
      id: r.id,
      name: r.name || 'Anonymous',
      location: r.location,
      lat: r.lat,
      lng: r.lng,
      type: r.type,
      severity: r.severity,
      time: r.time,
      date: r.date,
      status: r.status,
    }));

  res.json(mapReady);
};


const ADVISORY_DB = {
  Flood: { advisory: ['Move to higher ground immediately','Avoid flooded roads and bridges','Switch off electricity at the main switch','Do not walk through flowing water','Follow official evacuation orders'], impact: 'Flooding may disrupt transportation routes and utilities. Nearby residential areas could face severe damage. Power outages and water contamination are likely.', checklist: ['Move to safe location','Inform nearby residents','Avoid flood zones','Follow official instructions','Stock emergency supplies','Keep emergency contacts ready'] },
  Earthquake: { advisory: ['Drop, Cover, and Hold On','Move away from windows and exterior walls','Stay away from buildings after tremors','Avoid using elevators','Check for gas leaks and fires'], impact: 'Earthquake may cause structural damage to buildings and infrastructure. Aftershocks are likely. Power, gas, and water supply disruptions expected.', checklist: ['Drop, Cover, Hold','Check for injuries','Avoid damaged buildings','Turn off gas supply','Listen to emergency broadcasts','Use text over calls'] },
  Fire: { advisory: ['Use the nearest fire exit immediately','Stay low to avoid smoke inhalation','Do not use elevators during fire','Call emergency services (101)','Never re-enter a burning building'], impact: 'Fire may spread rapidly. Smoke inhalation is a serious risk. Nearby structures and utilities may be affected.', checklist: ['Evacuate immediately','Call fire department (101)','Stay low under smoke','Help others evacuate','Do not re-enter building','Meet at evacuation point'] },
  Cyclone: { advisory: ['Stay indoors away from windows','Issue coastal evacuation orders','Secure loose outdoor items','Stock food and water for 72 hours','Follow official shelter advisories'], impact: 'Cyclone will bring high winds, storm surges, and heavy rainfall. Coastal and low-lying areas face severe inundation risk.', checklist: ['Move away from coast','Stock emergency supplies','Secure your home','Charge all devices','Monitor weather updates','Follow evacuation orders'] },
  Tsunami: { advisory: ['Move to high ground immediately','Do not wait for official warning','Follow designated evacuation routes','Stay away from the beach','Wait for all-clear signal before returning'], impact: 'Tsunami waves can travel far inland and arrive in multiple waves. Coastal communities face extreme risk.', checklist: ['Evacuate coastline NOW','Move to high ground','Follow evacuation signs','Do not return until cleared','Help others evacuate','Monitor emergency channels'] },
  Landslide: { advisory: ['Evacuate immediately if you hear rumbling','Avoid river valleys and low-lying areas','Watch for changes in landscape','Do not cross roads near slopes','Report blocked roads to authorities'], impact: 'Landslide may block roads and destroy homes. Rescue operations may be delayed.', checklist: ['Evacuate danger zone','Avoid river banks','Report to authorities','Clear blocked routes if safe','Help stranded persons','Monitor local alerts'] },
  'Industrial Accident': { advisory: ['Evacuate the affected area immediately','Stay upwind of the incident','Do not touch unknown chemicals','Call emergency services immediately','Follow hazmat team instructions'], impact: 'Industrial accidents may release toxic chemicals or radiation. Air, water, and soil contamination are possible.', checklist: ['Evacuate immediately','Stay upwind','Cover nose and mouth','Call emergency services','Avoid touching chemicals','Follow hazmat guidance'] },
};

export const getDisasterAdvisory = (req, res) => {
  const { type } = req.params;
  const data = ADVISORY_DB[type] || { advisory: ['Assess the situation carefully','Alert local emergency services','Follow official guidance','Evacuate if necessary','Stay informed via emergency broadcasts'], impact: 'This disaster may pose risks to life and infrastructure. Local authorities are assessing the situation.', checklist: ['Stay calm','Move to safe location','Contact emergency services','Help nearby residents','Follow official instructions','Avoid the disaster zone'] };
  res.json({ type, ...data });
};


const AI_PRIORITY = {
  High:   { Flood:'CRITICAL', Earthquake:'CRITICAL', Cyclone:'CRITICAL', Tsunami:'CRITICAL', Fire:'HIGH', Landslide:'HIGH', 'Industrial Accident':'HIGH' },
  Medium: { Flood:'HIGH', Earthquake:'HIGH', Cyclone:'HIGH', Fire:'MEDIUM', Landslide:'MEDIUM', Tsunami:'CRITICAL', 'Industrial Accident':'MEDIUM' },
  Low:    { Flood:'LOW', Earthquake:'MEDIUM', Cyclone:'MEDIUM', Fire:'LOW', Landslide:'LOW', Tsunami:'HIGH', 'Industrial Accident':'LOW' },
};

export const getFullReports = (req, res) => {
  const reports = readData();
  const enriched = reports.map(r => {
    const aiLabel = (AI_PRIORITY[r.severity] || {})[r.type] || 'MEDIUM';
    return {
      ...r,
      disasterType: r.type,
      phoneNumber: r.phone,
      maskedAadhaar: r.aadhaar ? r.aadhaar.replace(/.(?=.{4})/g, '*') : '****-****-****',
      status: r.status || 'pending',
      aiPriorityLabel: aiLabel,
    };
  }).sort((a, b) => ({ CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3 }[a.aiPriorityLabel]??4) - ({ CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3 }[b.aiPriorityLabel]??4));
  res.json(enriched);
};

export const updateReportStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const reports = readData();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Report not found' });
  reports[idx].status = status;
  writeData(reports);
  res.json({ message: 'Status updated', report: reports[idx] });
};
