import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import shelterRoutes from './routes/shelterRoutes.js';
import animalRescueRoutes from './routes/animalRescueRoutes.js';
import sosRoutes from './routes/sosRoutes.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ── Serve uploaded files (audio, videos, images) ─────────────────────────────
app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')));
// ─────────────────────────────────────────────────────────────────────────────


app.use("/api", reportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", predictionRoutes);
app.use("/api", shelterRoutes);
app.use("/api", animalRescueRoutes);
app.use("/api", sosRoutes);


// ── Startup migration ──────────────────────────────────────────────────────────
// Any report that was created before we added the status workflow (no `status`
// field) is treated as pre-verified legacy data and stamped as 'verified' so
// it keeps appearing on the public dashboard.
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const dataFile   = path.join(__dirname, 'data/reports.json');

try {
  if (fs.existsSync(dataFile)) {
    const raw     = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    let changed   = false;
    const updated = raw.map(r => {
      if (!r.status) { changed = true; return { ...r, status: 'verified' }; }
      return r;
    });
    if (changed) {
      fs.writeFileSync(dataFile, JSON.stringify(updated, null, 2));
      console.log('[Migration] Stamped legacy reports with status=verified');
    }
  }
} catch (e) {
  console.error('[Migration] Failed to migrate reports.json:', e.message);
}
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
