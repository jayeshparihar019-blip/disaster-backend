import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

const router    = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.mimetype.startsWith('audio') ? 'audio' : file.mimetype.startsWith('video') ? 'videos' : 'images'
    const dir  = path.join(__dirname, `../uploads/sos/${type}`)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('audio') ? '.webm' : '.jpg')
    cb(null, `sos_${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } })
const sosUpload = upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'audio', maxCount: 1 }])

// ── Data file ─────────────────────────────────────────────────────────────────
const dataFile = path.join(__dirname, '../data/sos_alerts.json')

function readAlerts() {
  try {
    if (!fs.existsSync(dataFile)) return []
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
  } catch { return [] }
}

function saveAlerts(alerts) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true })
  fs.writeFileSync(dataFile, JSON.stringify(alerts, null, 2))
}

// ── POST /api/sos — create new SOS alert ─────────────────────────────────────
router.post('/sos', sosUpload, (req, res) => {
  try {
    const {
      type, name, phone, description, lat, lng,
      disasterType, animalType, animalCondition,
      trappedCount, medicalEmergency,
    } = req.body

    if (!type || !name || !phone) {
      return res.status(400).json({ error: 'type, name, and phone are required' })
    }

    const photoFile = req.files?.photo?.[0]
    const audioFile = req.files?.audio?.[0]

    const now   = new Date()
    const alert = {
      alertId:         `SOS-${Date.now()}`,
      type,
      name:            name.trim(),
      phone:           phone.trim(),
      description:     description?.trim() || '',
      latitude:        lat ? parseFloat(lat) : null,
      longitude:       lng ? parseFloat(lng) : null,
      extraDetails: {
        disasterType:     disasterType   || null,
        animalType:       animalType     || null,
        animalCondition:  animalCondition|| null,
        trappedCount:     trappedCount   ? parseInt(trappedCount) : null,
        medicalEmergency: medicalEmergency || 'No',
      },
      photoUrl:  photoFile ? `/uploads/sos/images/${photoFile.filename}` : null,
      audioUrl:  audioFile ? `/uploads/sos/audio/${audioFile.filename}`  : null,
      status:    'pending',
      timestamp: now.toISOString(),
      date:      now.toLocaleDateString('en-IN'),
      time:      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }

    const alerts = readAlerts()
    alerts.unshift(alert)
    saveAlerts(alerts)

    console.log(`[SOS] New alert: ${alert.alertId} | Type: ${type} | From: ${name} (${phone}) | ${alert.latitude ? `${alert.latitude.toFixed(4)},${alert.longitude.toFixed(4)}` : 'no GPS'}`)

    res.status(201).json({ success: true, alertId: alert.alertId, message: 'SOS alert sent successfully' })
  } catch (err) {
    console.error('[SOS] Error saving alert:', err.message)
    res.status(500).json({ error: 'Failed to save SOS alert' })
  }
})

// ── GET /api/sos — list all SOS alerts (admin) ───────────────────────────────
router.get('/sos', (req, res) => {
  try {
    const alerts = readAlerts()
    const { type, status } = req.query
    const filtered = alerts.filter(a => {
      if (type   && a.type   !== type)   return false
      if (status && a.status !== status) return false
      return true
    })
    res.json(filtered)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SOS alerts' })
  }
})

// ── PATCH /api/sos/:alertId — update status ───────────────────────────────────
router.patch('/sos/:alertId', (req, res) => {
  try {
    const { alertId } = req.params
    const { status }  = req.body
    const valid = ['pending', 'team_assigned', 'in_progress', 'resolved']
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })

    const alerts = readAlerts()
    const idx    = alerts.findIndex(a => a.alertId === alertId)
    if (idx === -1) return res.status(404).json({ error: 'Alert not found' })

    alerts[idx] = { ...alerts[idx], status }
    saveAlerts(alerts)
    res.json({ success: true, alert: alerts[idx] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update SOS status' })
  }
})

export default router
