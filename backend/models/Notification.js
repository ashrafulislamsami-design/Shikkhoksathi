const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['tutoring_request', 'session_update'],
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TutoringRequest'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
