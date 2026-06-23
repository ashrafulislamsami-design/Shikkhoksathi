const express = require('express');
const router = express.Router();
const {
  analyzeSkillGaps,
  getCareerRoadmaps,
  getJobListings,
  saveJob,
  getCourseRecommendations,
  getCareerRoadmap
} = require('../controllers/careerController');
const { protect } = require('../middleware/auth');

router.post('/analyze-gaps', protect, analyzeSkillGaps);
router.get('/roadmaps', protect, getCareerRoadmaps);
router.get('/jobs', protect, getJobListings);
router.post('/jobs/save', protect, saveJob);
router.get('/courses', protect, getCourseRecommendations);
router.post('/roadmap', protect, getCareerRoadmap);

module.exports = router;
