const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead
} = require('../controllers/tutoringController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
