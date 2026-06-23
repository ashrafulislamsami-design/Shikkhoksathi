const mongoose = require('mongoose');

const tutoringRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the student
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher', // Refers to the teacher
        required: false
    },
    topic: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    strengths: {
        type: String,
        required: true
    },
    weaknesses: {
        type: String,
        required: true
    },
    preferredTime: {
        type: String, // Can be Date or String as per user request
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    sessionType: {
        type: String,
        enum: ['live', 'recorded'],
        default: 'live'
    },
    meetingLink: {
        type: String // Google Meet Link
    },
    recordingLink: {
        type: String // Google Drive Link
    },
    scheduledAt: {
        type: Date
    },
    // Session Evaluation Fields
    requesterLinkClicked: {
        type: Boolean,
        default: false
    },
    requesterEvaluation: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        submittedAt: { type: Date }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TutoringRequest', tutoringRequestSchema);
