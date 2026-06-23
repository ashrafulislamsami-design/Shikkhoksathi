const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getDetailedAnalytics,
  generateSprintPlan,
  updateSprintProgress,
  getReadinessRadar,
  getYouTubeRecommendations
} = require('../controllers/performanceController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboard);
router.get('/analytics', protect, getDetailedAnalytics);
router.post('/sprint-plan', protect, generateSprintPlan);
router.put('/sprint-plan/progress', protect, updateSprintProgress);
router.get('/readiness-radar', protect, getReadinessRadar);
router.get('/video-recommendations', protect, getYouTubeRecommendations);

module.exports = router;