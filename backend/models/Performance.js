const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  overallReadiness: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  subjectReadiness: [{
    subject: String,
    readiness: Number,
    lastUpdated: Date,
    trend: String // 'improving', 'stable', 'declining'
  }],
  topicMastery: [{
    subject: String,
    topic: String,
    mastery: Number, // 0-100
    attempts: Number,
    lastPracticed: Date
  }],
  irtAbility: {
    type: Number,
    default: 0 // Theta parameter in IRT
  },
  predictions: {
    examScore: Number,
    confidence: Number,
    lastUpdated: Date
  },
  sprintPlan: {
    currentSprint: {
      startDate: Date,
      endDate: Date,
      goals: [{
        description: String,
        completed: Boolean,
        dueDate: Date
      }],
      dailyTasks: [{
        date: Date,
        tasks: [String],
        completed: Boolean
      }]
    },
    history: [{
      startDate: Date,
      endDate: Date,
      completionRate: Number
    }]
  },
  weakAreas: [{
    subject: String,
    topic: String,
    severity: String, // 'critical', 'moderate', 'minor'
    recommendation: String
  }],
  
  // REPLACE THIS BLOCK
  studyStats: {
    totalStudyTime: { type: Number, default: 0 },      // <--- Added default: 0
    testsCompleted: { type: Number, default: 0 },      // <--- Added default: 0
    questionsAttempted: { type: Number, default: 0 },  // <--- Added default: 0
    averageAccuracy: { type: Number, default: 0 },     // <--- Added default: 0
    lastActiveDate: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Performance', performanceSchema);