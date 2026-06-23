const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined for non-students or before generation
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String, // Base64 or image URL
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    default: 'student'
  },
  studentClass: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    required: true,
    default: '10'
  },
  stream: {
    type: String,
    enum: ['Science', 'Arts', 'Commerce', 'General', null],
    default: null,
    validate: {
      validator: function (v) {
        // Stream is required for classes 11-12, optional otherwise
        const classNum = parseInt(this.studentClass);
        if (classNum >= 11) {
          return v !== null && v !== undefined;
        }
        return true;
      },
      message: 'Stream is required for classes 11-12'
    }
  },
  badges: {
    type: [String],
    default: []
  },
  shikshaCoins: {
    type: Number,
    default: 0
  },
  coins: {
    type: Number,
    default: 0
  },
  xp: {
    type: Number,
    default: 0
  },
  careerPath: {
    type: String,
    default: ""
  },
  classLevel: {
    type: Number,
    min: 1,
    max: 12,
    default: 10
  },
  completedTopics: {
    type: [{
      subject: String,
      topic: String,
      completedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  profile: {
    class: {
      type: String,
      enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'HSC1', 'HSC2']
    },
    board: {
      type: String,
      enum: ['Dhaka', 'Chittagong', 'Rajshahi', 'Sylhet', 'Barisal', 'Dinajpur', 'Comilla', 'Jessore', 'Madrasah', 'Technical']
    },
    // In friend's User.js (Student Schema)
    school: {
      type: String,
      default: "" // e.g., "Dhaka City School"
    },
    preferredLanguage: {
      type: String,
      enum: ['bangla', 'english'],
      default: 'bangla'
    },
    location: {
      division: String,
      district: String,
      area: String
    },
    interests: [String],
    strengths: [String],
    weaknesses: [String]
  },
  gamification: {
    lifetimePoints: {
      type: Number,
      default: 0,
      index: true
    },
    shikshaCoins: {
      type: Number,
      default: 0
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActive: { type: Date, default: null }
    },
    achievements: [{
      id: String,
      title: String,
      icon: String,
      unlockedAt: { type: Date, default: Date.now }
    }],
    stats: {
      dailyStreak: { type: Number, default: 0 },
      totalTestsTaken: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 }
    },
    // Backwards compatibility/Legacy fields if needed (optional, keeping clean for now)
    level: { type: Number, default: 1 }
  },
  tutorProfile: {
    isActive: {
      type: Boolean,
      default: false
    },
    expertise: [String],
    rating: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    bio: String
  },
  offlineMode: {
    lastSynced: Date,
    cachedContent: [{
      type: String,
      contentId: mongoose.Schema.Types.ObjectId
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  // 1. If password is not modified, just return (ends the function)
  if (!this.isModified('password')) return;

  // 2. Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // 3. No need to call next(); the async function resolving signals completion
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);