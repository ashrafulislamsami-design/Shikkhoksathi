const express = require('express');
const router = express.Router();
const iepController = require('../controllers/iepController');

// Route to generate a new IEP
router.post('/generate', iepController.generateIEP);

// Route to get all IEPs for a teacher
router.get('/teacher/:teacherId', iepController.getTeacherIEPs);

// Route to get one specific IEP
router.get('/:id', iepController.getIEP);

// Route to update an IEP
router.put('/:id', iepController.updateIEP);

// Route to delete an IEP
router.delete('/:id', iepController.deleteIEP);

module.exports = router;