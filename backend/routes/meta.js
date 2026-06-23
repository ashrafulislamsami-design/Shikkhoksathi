const express = require('express');
const router = express.Router();
const { getSubjectsForClass, getStreamsForClass, requiresStream } = require('../config/nctb_subjects');

/**
 * @route   GET /api/meta/subjects
 * @desc    Get subjects for a specific class level and stream
 * @access  Public
 * @query   classLevel (required), stream (optional)
 */
router.get('/subjects', (req, res) => {
    try {
        let { classLevel, stream } = req.query;
        console.log(`[DEBUG] Received request for subjects. classLevel: ${classLevel}, stream: ${stream}`);

        if (!classLevel) {
            return res.status(400).json({
                success: false,
                message: 'classLevel query parameter is required'
            });
        }

        // Robust parsing: Handle "Class 10", "10", "HSC1", "HSC2" etc.
        let classNum = NaN;
        const classStr = String(classLevel).trim().toUpperCase();

        if (classStr.includes('HSC1')) classNum = 11;
        else if (classStr.includes('HSC2')) classNum = 12;
        else classNum = parseInt(classStr.replace(/[^0-9]/g, ''));

        if (isNaN(classNum) || classNum < 1 || classNum > 12) {
            console.warn(`[DEBUG] Invalid classLevel parsed: ${classNum} from original: ${classLevel}`);
            return res.status(400).json({
                success: false,
                message: 'classLevel must be a number between 1 and 12'
            });
        }

        const subjects = getSubjectsForClass(classNum, stream);
        const streams = getStreamsForClass(classNum);
        const needsStream = requiresStream(classNum);

        res.json({
            success: true,
            data: {
                classLevel: classNum,
                stream: stream || null,
                subjects,
                availableStreams: streams,
                requiresStream: needsStream
            }
        });
    } catch (error) {
        console.error('Subject fetch error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch subjects'
        });
    }
});

/**
 * @route   GET /api/meta/streams
 * @desc    Get available streams for a class level
 * @access  Public
 * @query   classLevel (required)
 */
router.get('/streams', (req, res) => {
    try {
        const { classLevel } = req.query;

        if (!classLevel) {
            return res.status(400).json({
                success: false,
                message: 'classLevel query parameter is required'
            });
        }

        const classNum = parseInt(classLevel);

        if (isNaN(classNum) || classNum < 1 || classNum > 12) {
            return res.status(400).json({
                success: false,
                message: 'classLevel must be a number between 1 and 12'
            });
        }

        const streams = getStreamsForClass(classNum);
        const needsStream = requiresStream(classNum);

        res.json({
            success: true,
            data: {
                classLevel: classNum,
                streams,
                requiresStream: needsStream
            }
        });
    } catch (error) {
        console.error('Stream fetch error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch streams'
        });
    }
});

module.exports = router;
