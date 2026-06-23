const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, school, district, upazila, division, subjects, classes, designation, avatar } = req.body;

        const teacher = await Teacher.findById(req.user.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Update fields
        if (name) teacher.name = name;
        if (school) teacher.school = school;
        if (district) teacher.district = district;
        if (upazila) teacher.upazila = upazila;
        if (division) teacher.division = division;
        if (subjects) teacher.subjects = subjects;
        if (classes) teacher.classes = classes;
        if (designation) teacher.designation = designation;
        if (avatar) teacher.avatar = avatar;

        await teacher.save();

        res.json({
            success: true,
            data: {
                id: teacher._id,
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                school: teacher.school,
                district: teacher.district,
                upazila: teacher.upazila,
                division: teacher.division,
                subjects: teacher.subjects,
                classes: teacher.classes,
                designation: teacher.designation,
                avatar: teacher.avatar,
                role: teacher.role
            }
        });
    } catch (error) {
        console.error('Update teacher profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Change teacher password
// @route   POST /api/teachers/change-password
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

        const teacher = await Teacher.findById(req.user.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        // Verify current password
        const isPasswordMatch = await bcrypt.compare(currentPassword, teacher.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash and update password
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(newPassword, salt);
        await teacher.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Change teacher password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
