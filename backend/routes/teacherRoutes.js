const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  updateProfile,
  changePassword
} = require('../controllers/teacherAuthController');
const { protect } = require('../middleware/auth');

// Register new teacher
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, school, district, upazila, division, subjects, classes, designation, otp } = req.body;

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

    // Check if teacher exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create teacher
    const teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      school,
      district,
      upazila,
      division,
      subjects,
      classes,
      designation
    });

    await teacher.save();

    // Clean up OTP on success
    await OTP.deleteOne({ _id: validOtp._id });

    // Create token
    const token = jwt.sign(
      { id: teacher._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      token,
      teacher: {
        id: teacher._id,
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        school: teacher.school
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering teacher',
      error: error.message
    });
  }
});

// Login teacher
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find teacher
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: teacher._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      teacher: {
        id: teacher._id,
        _id: teacher._id, // Also include _id for consistency with MongoDB conventions
        name: teacher.name,
        email: teacher.email,
        school: teacher.school,
        subjects: teacher.subjects,
        classes: teacher.classes,
        avatar: teacher.avatar
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// Update teacher profile
router.put('/profile', protect, updateProfile);

// Change teacher password
router.post('/change-password', protect, changePassword);

// Get teacher profile
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('-password');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher',
      error: error.message
    });
  }
});

module.exports = router;
