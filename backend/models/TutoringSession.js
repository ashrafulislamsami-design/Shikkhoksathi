const mongoose = require('mongoose');

const tutoringSessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subject: {
    type: String,
    required: true
  },
  topic: String,
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  scheduledTime: Date,
  duration: Number, // in minutes
  coinsCost: {
    type: Number,
    required: true
  },
  recording: {
    url: String,
    duration: Number
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  notes: String,
  chat: [{
    sender: mongoose.Schema.Types.ObjectId,
    message: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

tutoringSessionSchema.index({ studentId: 1, createdAt: -1 });
tutoringSessionSchema.index({ tutorId: 1, status: 1 });

module.exports = mongoose.model('TutoringSession', tutoringSessionSchema);