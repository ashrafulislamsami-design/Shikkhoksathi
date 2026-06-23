const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  classLevel: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  generatedPlan: {
    type: String,
    required: true
  },
  objectives: [{
    type: String
  }],
  materials: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Lesson', lessonSchema);