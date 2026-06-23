const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skillGaps: [{
    skill: String,
    category: String, // 'STEM', 'soft_skill', 'technical', 'vocational'
    currentLevel: Number, // 0-100
    targetLevel: Number,
    priority: String, // 'high', 'medium', 'low'
    recommendations: [String]
  }],
  roadmap: Object, // Stores the strict AI-generated roadmap
  careerPathways: [{
    title: String,
    description: String,
    steps: [{
      phase: String,
      title: String,
      duration: String,
      requirements: [String],
      resources: [String]
    }],
    matchScore: Number, // How well it fits the student
    estimatedDuration: String,
    potentialSalary: String,
    demandLevel: String
  }],
  recommendations: {
    courses: [{
      title: String,
      provider: String,
      url: String,
      duration: String,
      cost: String,
      relevance: Number
    }],
    certifications: [{
      name: String,
      authority: String,
      value: String
    }],
    extracurriculars: [String]
  },
  jobMarket: {
    savedJobs: [{
      title: String,
      company: String,
      location: String,
      salary: String,
      requirements: [String],
      url: String,
      scrapedAt: Date
    }],
    recommendations: [{
      title: String,
      matchScore: Number,
      reason: String
    }]
  },
  selfAssessment: {
    completedRubrics: [{
      skill: String,
      score: Number,
      date: Date
    }]
  }
}, {
  timestamps: true,
  versionKey: false
});

//careerSchema.index({ userId: 1 });

module.exports = mongoose.model('Career', careerSchema);