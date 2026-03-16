import express from 'express';
const router = express.Router();

import { createReport, getReports, getMapData, getDisasterAdvisory, getFullReports, updateReportStatus } from '../controllers/reportController.js';
import { verifyToken } from '../controllers/authController.js';
import { reportUpload } from '../middleware/uploadMiddleware.js';

// POST /api/report — now accepts multipart/form-data with optional audio/video/image
router.post('/report', reportUpload, createReport);

router.get('/alerts', getReports);
router.get('/map-data', getMapData);
router.get('/disaster-advisory/:type', getDisasterAdvisory);

// GET /api/reports — no auth required (frontend ProtectedRoute handles access control)
router.get('/reports', getFullReports);

// PATCH /api/reports/:id — auth required for status updates
router.patch('/reports/:id', verifyToken, updateReportStatus);

export default router;
