import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

const router  = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Multer setup for rescue photos ───────────────────────────────────────────
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/rescue-photos')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `rescue_${Date.now()}${ext}`)
  },
})
const upload = multer({ storage: photoStorage, limits: { fileSize: 10 * 1024 * 1024 } })

// ── Data file ─────────────────────────────────────────────────────────────────
const dataFile = path.join(__dirname, '../data/animal_rescue_reports.json')

function readReports() {
  try {
    if (!fs.existsSync(dataFile)) return []
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
  } catch { return [] }
}

function saveReports(reports) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true })
  fs.writeFileSync(dataFile, JSON.stringify(reports, null, 2))
}

// ── POST /api/animal-rescue-report ───────────────────────────────────────────
router.post('/animal-rescue-report', upload.single('photo'), (req, res) => {
  try {
    const { name, phone, animalType, location, description, aiDetectedAnimal } = req.body

    if (!name || !phone || !location) {
      return res.status(400).json({ error: 'name, phone, and location are required' })
    }

    const report = {
      id:               `AR-${Date.now()}`,
      name:             name.trim(),
      phone:            phone.trim(),
      animalType:       animalType || 'Unknown',
      aiDetectedAnimal: aiDetectedAnimal || null,
      location:         location.trim(),
      description:      description?.trim() || '',
      photoUrl:         req.file ? `/uploads/rescue-photos/${req.file.filename}` : null,
      status:           'pending',
      createdAt:        new Date().toISOString(),
    }

    const reports = readReports()
    reports.unshift(report)
    saveReports(reports)

    console.log(`[Animal Rescue] New report: ${report.id} — ${report.animalType} at ${report.location}`)
    res.status(201).json({ success: true, id: report.id, message: 'Rescue request submitted successfully' })
  } catch (err) {
    console.error('[Animal Rescue] Error:', err.message)
    res.status(500).json({ error: 'Failed to save rescue report' })
  }
})

// ── GET /api/animal-rescue-reports ───────────────────────────────────────────
router.get('/animal-rescue-reports', (req, res) => {
  try {
    const reports = readReports()
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rescue reports' })
  }
})

// ── PATCH /api/animal-rescue-reports/:id ─────────────────────────────────────
router.patch('/animal-rescue-reports/:id', (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body
    const valid      = ['pending', 'rescue_team_assigned', 'resolved']
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })

    const reports = readReports()
    const idx     = reports.findIndex(r => r.id === id)
    if (idx === -1) return res.status(404).json({ error: 'Report not found' })

    reports[idx] = { ...reports[idx], status }
    saveReports(reports)
    res.json({ success: true, report: reports[idx] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' })
  }
})

// ── GET /api/nearby-vets ─────────────────────────────────────────────────────
router.get('/nearby-vets', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' })

  try {
    const radiusM = parseFloat(radius) * 1000
    const query   = `
      [out:json][timeout:15];
      (
        node["amenity"="veterinary"](around:${radiusM},${lat},${lng});
        node["amenity"="animal_shelter"](around:${radiusM},${lat},${lng});
        node["shop"="pet"](around:${radiusM},${lat},${lng});
      );
      out body;
    `
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `data=${encodeURIComponent(query)}`,
    })
    const data = await response.json()

    const vets = (data.elements || []).slice(0, 10).map(el => ({
      id:      el.id,
      name:    el.tags?.name || el.tags?.['name:en'] || 'Veterinary Clinic',
      address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || 'Nearby',
      phone:   el.tags?.phone || el.tags?.['contact:phone'] || null,
      lat:     el.lat,
      lng:     el.lon,
      distance: Math.round(Math.sqrt(Math.pow((el.lat - parseFloat(lat)) * 111, 2) + Math.pow((el.lon - parseFloat(lng)) * 111 * Math.cos(parseFloat(lat) * Math.PI / 180), 2)) * 10) / 10,
    })).sort((a, b) => a.distance - b.distance)

    if (vets.length === 0) {
      // Return useful fallback
      return res.json([
        { name: 'Government Livestock Hospital', distance: null, phone: '1962', address: 'Contact your district office' },
        { name: 'Wildlife SOS Emergency',         distance: null, phone: '9871963535', address: 'Pan India NGO' },
        { name: 'Forest Department Helpline',     distance: null, phone: '1926', address: 'Wildlife emergency' },
      ])
    }

    res.json(vets)
  } catch (err) {
    console.error('[Nearby Vets] Overpass error:', err.message)
    res.json([
      { name: 'Government Livestock Hospital', distance: null, phone: '1962', address: 'Contact your district office' },
      { name: 'Wildlife SOS Emergency',         distance: null, phone: '9871963535', address: 'Pan India' },
    ])
  }
})

export default router
