const mongoose = require('mongoose');

const iepSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  strengths: {
    type: String,
    required: true
  },
  weaknesses: {
    type: String,
    required: true
  },
  smartGoals: [{
    type: String
  }],
  complianceFlag: {
    type: Boolean,
    default: true // References Section 31 of the 2013 Act for legal alignment
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IEP', iepSchema);