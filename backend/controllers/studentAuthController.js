const User = require('../models/User');
const Teacher = require('../models/Teacher');
const OTP = require('../models/OTP');
const Performance = require('../models/Performance');
const Career = require('../models/Career');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper: Generate Unique Student ID (TUS + 5 digits)
const generateStudentId = async () => {
  let studentId;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    studentId = `TUS${randomDigits}`;
    const existing = await User.findOne({ studentId });
    if (!existing) isUnique = true;
    attempts++;
  }
  return studentId;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, profile, studentClass, stream, otp } = req.body;

    // Block temporary/disposable emails
    const { isDisposableEmail } = require('../utils/emailValidator');
    if (isDisposableEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Temporary or disposable emails are not allowed.'
      });
    }

    // Validate OTP
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification code (OTP) is required'
      });
    }

    const validOtp = await OTP.findOne({ email: email.toLowerCase(), otp });
    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Validate studentClass
    if (!studentClass || !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(studentClass)) {
      return res.status(400).json({
        success: false,
        message: 'Valid studentClass (1-12) is required'
      });
    }

    // Validate stream for classes 11-12
    const classNum = parseInt(studentClass);
    if (classNum >= 11) {
      if (!stream || !['Science', 'Arts', 'Commerce', 'General'].includes(stream)) {
        return res.status(400).json({
          success: false,
          message: 'Stream (Science, Arts, Commerce, or General) is required for classes 11-12'
        });
      }
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate Student ID
    const studentId = await generateStudentId();

    // Create user with new fields
    const user = await User.create({
      name,
      email,
      password,
      studentId,
      studentClass,
      stream: classNum >= 11 ? stream : null,
      profile: profile || {},
      badges: [],
      xp: 0,
      coins: 0
    });

    // Initialize performance tracking
    await Performance.create({
      userId: user._id,
      overallReadiness: 0,
      subjectReadiness: [],
      topicMastery: []
    });

    // Initialize career tracking
    await Career.create({
      userId: user._id,
      skillGaps: [],
      careerPathways: []
    });

    // Award welcome coins and initialize gamification
    user.gamification = user.gamification || {};
    user.gamification.shikshaCoins = 100;
    user.gamification.lifetimePoints = 0;
    user.gamification.streak = {
      current: 0,
      longest: 0,
      lastActive: null
    };
    user.coins = 100;
    await user.save();

    // Clean up OTP on success
    await OTP.deleteOne({ _id: validOtp._id });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          studentClass: user.studentClass,
          stream: user.stream,
          profile: user.profile,
          gamification: user.gamification,
          badges: user.badges
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send verification OTP to email
// @route   POST /api/student/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Block temporary/disposable emails
    const { isDisposableEmail } = require('../utils/emailValidator');
    if (isDisposableEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Temporary or disposable emails are not allowed.'
      });
    }

    // Check if user already exists
    const studentExists = await User.findOne({ email });
    const teacherExists = await Teacher.findOne({ email });
    if (studentExists || teacherExists) {
      return res.status(400).json({
        success: false,
        message: 'Account already exists with this email address'
      });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in DB, update if already exists
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true, new: true }
    );

    // Send the email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully!'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending verification code'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Initialize streak if not exists
    if (!user.gamification.streak) {
      user.gamification.streak = {
        current: 0,
        longest: 0,
        lastActive: null
      };
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.gamification.streak.lastActive;

    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      lastActiveDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        user.gamification.streak.current += 1;
        if (user.gamification.streak.current > user.gamification.streak.longest) {
          user.gamification.streak.longest = user.gamification.streak.current;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        user.gamification.streak.current = 1;
      }
      // If daysDiff === 0, same day login, don't change streak
    } else {
      // First login
      user.gamification.streak.current = 1;
      user.gamification.streak.longest = 1;
    }

    // Demo: Generate studentId for existing users if missing
    if (user.role === 'student' && !user.studentId) {
      user.studentId = await generateStudentId();
    }

    user.gamification.streak.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          profile: user.profile,
          gamification: user.gamification
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/student/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, profile, tutorProfile, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;

    // Safely update profile fields without overwriting nested objects
    if (profile) {
      // Ensure profile object exists
      user.profile = user.profile || {};

      // Update only provided fields, preserve existing nested objects
      Object.keys(profile).forEach(key => {
        if (key === 'location') {
          // Merge location object
          user.profile.location = user.profile.location || {};
          Object.assign(user.profile.location, profile.location);
        } else {
          // Direct assignment for other fields
          user.profile[key] = profile[key];
        }
      });
    }

    if (tutorProfile) {
      user.tutorProfile = { ...user.tutorProfile, ...tutorProfile };
    }
    if (avatar) {
      user.avatar = avatar; // Base64 or URL
    }

    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change user password
// @route   POST /api/student/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};