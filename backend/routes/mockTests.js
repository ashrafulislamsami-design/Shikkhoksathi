const express = require('express');
const router = express.Router();
const {
  generateMockTest,
  getNextQuestion,
  submitAnswer,
  completeMockTest,
  getMockTestHistory,
  getMockTestById,
  getMockTestHubData
} = require('../controllers/mockTestController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generateMockTest);
router.post('/:testId/next-question', protect, getNextQuestion);
router.post('/:testId/submit-answer', protect, submitAnswer);
router.post('/:testId/complete', protect, completeMockTest);
router.get('/history', protect, getMockTestHistory);
router.get('/hub-data', protect, getMockTestHubData);
router.get('/:testId', protect, getMockTestById);

module.exports = router;