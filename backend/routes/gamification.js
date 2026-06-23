const express = require('express');
const router = express.Router();
const {
  getGamificationProfile,
  earnCoins,
  spendCoins,
  getLeaderboard,
  checkDailyChallenge,
  awardBadge
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, getGamificationProfile);
router.post('/earn-coins', protect, earnCoins);
router.post('/spend-coins', protect, spendCoins);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/daily-challenge', protect, checkDailyChallenge);
router.post('/badges', protect, awardBadge);

module.exports = router;