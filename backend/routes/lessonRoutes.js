const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

// Higher priority static routes
router.post('/generate', lessonController.generateLesson);
router.post('/generate-iep', lessonController.generateIEP);
router.post('/pulse', lessonController.getClassroomPulse);
router.post('/micro-intervention', lessonController.generateMicroIntervention);

// Lower priority dynamic routes
router.get('/teacher/:teacherId', lessonController.getTeacherLessons);
router.get('/:id', lessonController.getLesson);
router.delete('/:id', lessonController.deleteLesson);

module.exports = router;