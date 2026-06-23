const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    enum: ['adaptive', 'full_syllabus', 'topic_specific', 'time_challenge'],
    required: true
  },
  subject: String,
  class: String,
  chapter: String,
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    userAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: { type: Boolean, default: false },
    marks: Number,
    remarks: String,
    timeSpent: Number, // in seconds
    difficultyAtTime: Number
  }],
  score: {
    raw: Number,
    percentage: Number,
    irtScore: Number // Estimated ability level
  },
  timing: {
    startedAt: Date,
    completedAt: Date,
    totalTime: Number,
    timeLimit: Number
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  feedback: mongoose.Schema.Types.Mixed,
  settings: {
    language: String,
    showExplanations: Boolean,
    allowPause: Boolean,
    difficultyMultiplier: { type: Number, default: 1.0 }
  }
}, {
  timestamps: true
});

mockTestSchema.index({ userId: 1, createdAt: -1 });
mockTestSchema.index({ status: 1 });

module.exports = mongoose.model('MockTest', mockTestSchema);
