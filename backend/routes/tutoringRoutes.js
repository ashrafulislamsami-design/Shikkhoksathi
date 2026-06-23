const express = require('express');
const router = express.Router();
const {
    createRequest,
    getMySessions,
    updateRequestStatus,
    getPotentialTutors,
    deleteRequest,
    markLinkClicked,
    submitEvaluation,
    getUserFeedback
} = require('../controllers/tutoringController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, createRequest);
router.get('/my-sessions', protect, getMySessions);
router.put('/request/:id', protect, updateRequestStatus);
router.delete('/request/:id', protect, deleteRequest);
router.get('/tutors', protect, getPotentialTutors);

// Session Evaluation Routes
router.put('/request/:id/link-clicked', protect, markLinkClicked);
router.post('/request/:id/evaluate', protect, submitEvaluation);
router.get('/feedback/:userId', getUserFeedback);

module.exports = router;
