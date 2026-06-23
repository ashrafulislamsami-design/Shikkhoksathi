const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  upazila: {
    type: String,
    required: true
  },
  division: {
    type: String,
    required: true
  },
  subjects: [{
    type: String
  }],
  classes: [{
    type: String
  }],
  designation: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'teacher'
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);