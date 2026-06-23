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

// GET Leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// GET Gamification Profile
router.get('/profile', protect, getGamificationProfile);

// POST Earn Coins
router.post('/earn-coins', protect, earnCoins);

// POST Spend Coins
router.post('/spend-coins', protect, spendCoins);

// GET Daily Challenge
router.get('/daily-challenge', protect, checkDailyChallenge);

// POST Award Badge
router.post('/badges', protect, awardBadge);

module.exports = router;
