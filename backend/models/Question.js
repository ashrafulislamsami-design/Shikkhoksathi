const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ['Math', 'Science', 'English', 'Bangla', 'Social Science', 'ICT', 'Physics', 'Chemistry', 'Biology', 'Higher Math', 'Religion']
  },
  topic: {
    type: String,
    required: true
  },
  subtopic: String,
  class: {
    type: String,
    required: true
  },
  board: String,
  questionText: {
    bangla: String,
    english: String
  },
    type: {
    type: String,
    enum: ['mcq', 'short_answer', 'essay', 'true_false', 'cq'],
    required: true
  },
  options: [{
    bangla: String,
    english: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    bangla: String,
    english: String
  },
  explanation: {
    bangla: String,
    english: String
  },
  difficulty: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5 // IRT difficulty parameter
  },
  discrimination: {
    type: Number,
    default: 1 // IRT discrimination parameter
  },
  guessing: {
    type: Number,
    default: 0.25 // IRT guessing parameter
  },
  tags: [String],
  yearAppeared: [Number], // Which exam years this appeared
  frequency: {
    type: Number,
    default: 0 // How often topic appears in exams
  },
  source: {
    type: String,
    enum: ['generated', 'past_paper', 'manual'],
    default: 'generated'
  }
}, {
  timestamps: true
});

// Index for efficient querying
questionSchema.index({ subject: 1, class: 1, topic: 1 });
questionSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);