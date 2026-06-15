const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public tracking endpoints (no auth required)
// Accept optional `site` field to separate analytics between deployments
router.post('/track/pageview', analyticsController.trackPageView);
router.post('/track/session', analyticsController.trackSession);

// Admin-only analytics viewing endpoints
router.get('/stats', protect, adminAuth, analyticsController.getTrafficStats);
router.get('/overtime', protect, adminAuth, analyticsController.getTrafficOverTime);

module.exports = router;
