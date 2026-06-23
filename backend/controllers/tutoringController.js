const TutoringRequest = require('../models/TutoringRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Teacher = require('../models/Teacher');

// @desc    Create a new tutoring request
// @route   POST /api/tutoring/request
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const { recipientId, topic, description, preferredTime, strengths, weaknesses } = req.body;
    const requesterId = req.user.id;

    // Validate requester is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can request tutoring' });
    }

    // Validate recipient is a teacher (if not a broadcast)
    const request = await TutoringRequest.create({
      requester: requesterId,
      recipient: recipientId || null,
      topic,
      description,
      strengths,
      weaknesses,
      preferredTime,
      status: 'pending'
    });

    const requesterName = req.user.name;

    if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        message: `${requesterName} requested a tutoring session on "${topic}".`,
        type: 'tutoring_request',
        relatedRequestId: request._id
      });
    } else {
      // Broadcast: Notify all teachers AND peer tutors
      const [allTeachers, allPeerTutors] = await Promise.all([
        Teacher.find().select('_id'),
        User.find({ 'tutorProfile.isActive': true, _id: { $ne: requesterId } }).select('_id')
      ]);

      const notifications = [
        ...allTeachers.map(t => ({
          recipient: t._id,
          message: `${requesterName} broadcasted a tutoring request on "${topic}".`,
          type: 'tutoring_request',
          relatedRequestId: request._id
        })),
        ...allPeerTutors.map(u => ({
          recipient: u._id,
          message: `${requesterName} broadcasted a tutoring request on "${topic}".`,
          type: 'tutoring_request',
          relatedRequestId: request._id
        }))
      ];

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({
      success: true,
      message: recipientId ? 'Request sent to teacher' : 'Request broadcasted successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's tutoring sessions (as requester or recipient)
// @route   GET /api/tutoring/my-sessions
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    let query;

    if (req.user.role === 'teacher') {
      // Teachers see direct requests OR broadcasts
      query = { $or: [{ recipient: userId }, { recipient: null }] };
    } else {
      // Students see their own requests OR broadcasts they can mentor (if they are a tutor)
      const isTutor = req.user.tutorProfile?.isActive;
      if (isTutor) {
        query = {
          $or: [
            { requester: userId },
            { recipient: userId },
            { recipient: null, requester: { $ne: userId } }
          ]
        };
      } else {
        query = { requester: userId };
      }
    }

    const sessions = await TutoringRequest.find(query)
      .populate('requester', 'name email profile studentClass stream')
      .sort({ createdAt: -1 });

    // Manual population for recipient (cross-collection)
    const sessionsWithRecipient = await Promise.all(sessions.map(async (session) => {
      const sessionObj = session.toObject();
      if (session.recipient) {
        // Try Teacher first
        let recipient = await Teacher.findById(session.recipient).select('name email school subjects');
        if (!recipient) {
          // Try User (Peer Tutor)
          recipient = await User.findById(session.recipient).select('name email profile studentClass stream');
          if (recipient) {
            recipient = {
              ...recipient.toObject(),
              role: 'Peer Tutor',
              subjects: recipient.profile?.strengths || []
            };
          }
        }
        sessionObj.recipient = recipient;
      }
      return sessionObj;
    }));

    res.json({ success: true, data: sessionsWithRecipient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update request status
// @route   PUT /api/tutoring/request/:id
// @access  Private
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;
    const userId = req.user.id;

    const request = await TutoringRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Security Check
    const isRequester = request.requester.toString() === userId;
    const isRecipient = request.recipient && request.recipient.toString() === userId;
    const isBroadcast = !request.recipient;

    // Authorization for mentors (Teacher or designated Peer Tutor)
    const isAuthorizedMentor = req.user.role === 'teacher' || req.user.tutorProfile?.isActive;

    if (status === 'accepted' || status === 'rejected') {
      if (!isRecipient && !(isBroadcast && isAuthorizedMentor)) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage this request' });
      }

      // If accepting a broadcast, assign it to the mentor
      if (status === 'accepted' && isBroadcast) {
        request.recipient = userId;
      }
    }

    if (status === 'completed') {
      if (!isRequester) {
        return res.status(403).json({ success: false, message: 'Only the requester can mark as completed' });
      }
    }

    const { sessionType, meetingLink, recordingLink, scheduledAt } = req.body;

    request.status = status;
    if (status === 'accepted') {
      if (sessionType) request.sessionType = sessionType;
      if (meetingLink) request.meetingLink = meetingLink;
      if (recordingLink) request.recordingLink = recordingLink;
      if (scheduledAt) request.scheduledAt = scheduledAt;
    }

    if (status === 'rejected') {
      // Notify requester if deleted by recipient
      await Notification.create({
        recipient: request.requester,
        message: `Your tutoring request for "${request.topic}" has been declined by the teacher.`,
        type: 'session_update',
        relatedRequestId: null
      });
      await TutoringRequest.findByIdAndDelete(requestId);
      return res.json({ success: true, message: 'Request rejected and deleted' });
    }

    await request.save();

    // Notify the other party
    const targetUserId = request.requester.toString() === userId ? request.recipient : request.requester;

    if (targetUserId) {
      await Notification.create({
        recipient: targetUserId,
        message: `Your tutoring request for "${request.topic}" has been marked as ${status} by ${req.user.name}.`,
        type: 'session_update',
        relatedRequestId: request._id
      });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a request
// @route   DELETE /api/tutoring/request/:id
// @access  Private
exports.deleteRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    const request = await TutoringRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Security Check: Only requester or recipient can delete
    if (request.requester.toString() !== userId && request.recipient?.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }

    // Notify requester if deleted by recipient
    if (request.recipient?.toString() === userId) {
      await Notification.create({
        recipient: request.requester,
        message: `Your tutoring request for "${request.topic}" has been deleted/declined by the teacher.`,
        type: 'session_update',
        relatedRequestId: null // Request is gone
      });
    }

    await TutoringRequest.findByIdAndDelete(requestId);

    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ recipient: userId, read: false })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search for potential tutors (other students/teachers)
// @route   GET /api/tutoring/tutors
// @access  Private
exports.getPotentialTutors = async (req, res) => {
  try {
    // Find all teachers
    const teachersRaw = await Teacher.find()
      .select('name school subjects classes designation');

    // Find all active peer tutors
    const peerTutorsRaw = await User.find({ 'tutorProfile.isActive': true, _id: { $ne: req.user.id } })
      .select('name profile email');

    const teachers = teachersRaw.map(t => ({
      _id: t._id,
      name: t.name,
      role: 'teacher',
      profile: {
        school: t.school,
        class: t.classes?.join(', ') || 'Various',
        strengths: t.subjects || [t.designation]
      }
    }));

    const peerTutors = peerTutorsRaw.map(u => ({
      _id: u._id,
      name: u.name,
      role: 'Peer Tutor',
      profile: {
        school: u.profile?.school || 'Student',
        class: u.profile?.class || u.studentClass || 'X',
        strengths: u.profile?.strengths || []
      }
    }));

    res.json({ success: true, data: [...teachers, ...peerTutors] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark meeting link as clicked (by requester/student)
// @route   PUT /api/tutoring/request/:id/link-clicked
// @access  Private
exports.markLinkClicked = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    const request = await TutoringRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the requester (student) can mark the link as clicked
    if (request.requester.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the student can mark the link as clicked' });
    }

    request.requesterLinkClicked = true;
    await request.save();

    res.json({ success: true, message: 'Link click recorded', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit session evaluation (Student to Teacher only - One-Way)
// @route   POST /api/tutoring/request/:id/evaluate
// @access  Private
exports.submitEvaluation = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const request = await TutoringRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the requester (student) can submit evaluation - ONE-WAY flow
    const isRequester = request.requester.toString() === userId;

    if (!isRequester) {
      return res.status(403).json({ success: false, message: 'Only students can rate their tutoring sessions' });
    }

    // Check trigger conditions for requester (student)
    if (!request.requesterLinkClicked) {
      return res.status(400).json({ success: false, message: 'You must join the session before submitting feedback' });
    }
    if (request.scheduledAt && new Date() < new Date(request.scheduledAt)) {
      return res.status(400).json({ success: false, message: 'You can only submit feedback after the scheduled session time' });
    }
    if (request.requesterEvaluation && request.requesterEvaluation.rating) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this session' });
    }

    request.requesterEvaluation = { rating, comment, submittedAt: new Date() };
    await request.save();

    res.json({ success: true, message: 'Evaluation submitted successfully', data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get anonymous feedback for a user (for profile display) - Student feedback only
// @route   GET /api/tutoring/feedback/:userId
// @access  Public
exports.getUserFeedback = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Find sessions where the user was recipient (teacher) and has requesterEvaluation
    // This is the ONLY source of feedback since evaluation is one-way (student to teacher)
    const asRecipient = await TutoringRequest.find({
      recipient: targetUserId,
      'requesterEvaluation.rating': { $exists: true }
    }).select('requesterEvaluation topic createdAt');

    // Anonymize and format feedback - all feedback is from students
    const feedbackReceived = asRecipient.map(s => ({
      rating: s.requesterEvaluation.rating,
      comment: s.requesterEvaluation.comment,
      topic: s.topic,
      date: s.requesterEvaluation.submittedAt || s.createdAt,
      type: 'from_student'
    }));

    // Calculate average rating
    const totalRatings = feedbackReceived.length;
    const averageRating = totalRatings > 0
      ? (feedbackReceived.reduce((sum, f) => sum + f.rating, 0) / totalRatings).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        averageRating: averageRating ? parseFloat(averageRating) : null,
        totalReviews: totalRatings,
        feedback: feedbackReceived.sort((a, b) => new Date(b.date) - new Date(a.date))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};