const Performance = require('../models/Performance');
const MockTest = require('../models/MockTest');
const User = require('../models/User');
const groqService = require('../services/groqService');
const irtService = require('../services/irtService');

// @desc    Get performance dashboard
// @route   GET /api/performance/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    let performance = await Performance.findOne({ userId });
    const user = await User.findById(userId);

    if (!performance) {
      // Create performance record if it doesn't exist
      performance = await Performance.create({
        userId,
        overallReadiness: 0,
        subjectReadiness: [],
        topicMastery: [],
        studyStats: {
          totalStudyTime: 0,
          testsCompleted: 0,
          questionsAttempted: 0,
          averageAccuracy: 0
        }
      });
    }

    // Get recent test performance
    const recentTests = await MockTest.find({
      userId,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject score createdAt');

    // Calculate trends
    const subjectTrends = {};
    recentTests.forEach(test => {
      if (!subjectTrends[test.subject]) {
        subjectTrends[test.subject] = [];
      }
      subjectTrends[test.subject].push(test.score.percentage);
    });

    // Determine trend direction for each subject
    Object.keys(subjectTrends).forEach(subject => {
      const scores = subjectTrends[subject];
      if (scores.length >= 2) {
        const recent = scores[0];
        const previous = scores[1];
        const trend = recent > previous ? 'improving' : recent < previous ? 'declining' : 'stable';

        const subjectIndex = performance.subjectReadiness.findIndex(s => s.subject === subject);
        if (subjectIndex !== -1) {
          performance.subjectReadiness[subjectIndex].trend = trend;
        }
      }
    });

    await performance.save();

    res.json({
      success: true,
      data: {
        overallReadiness: performance.overallReadiness,
        subjectReadiness: performance.subjectReadiness,
        recentTests,
        studyStats: performance.studyStats,
        weakAreas: performance.weakAreas,
        currentStreak: user.gamification.stats?.dailyStreak || 0,
        predictions: performance.predictions
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get detailed analytics
// @route   GET /api/performance/analytics
// @access  Private
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, timeRange = '30' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    const query = {
      userId,
      status: 'completed',
      createdAt: { $gte: startDate }
    };

    if (subject) {
      query.subject = subject;
    }

    const tests = await MockTest.find(query)
      .populate('questions.questionId')
      .sort({ createdAt: 1 });

    // Analyze performance by topic
    const topicPerformance = {};
    const timeAnalysis = [];
    const difficultyAnalysis = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    tests.forEach(test => {
      timeAnalysis.push({
        date: test.createdAt,
        score: test.score.percentage,
        irtScore: test.score.irtScore
      });

      test.questions.forEach(q => {
        const question = q.questionId;
        const topic = question.topic;

        if (!topicPerformance[topic]) {
          topicPerformance[topic] = {
            correct: 0,
            total: 0,
            avgTime: 0,
            difficulty: question.difficulty
          };
        }

        topicPerformance[topic].total += 1;
        if (q.isCorrect) topicPerformance[topic].correct += 1;
        topicPerformance[topic].avgTime += q.timeSpent || 0;

        // Difficulty analysis
        const diffLevel = question.difficulty < 0.4 ? 'easy' :
          question.difficulty < 0.7 ? 'medium' : 'hard';
        difficultyAnalysis[diffLevel].total += 1;
        if (q.isCorrect) difficultyAnalysis[diffLevel].correct += 1;
      });
    });

    // Calculate topic mastery percentages
    Object.keys(topicPerformance).forEach(topic => {
      const data = topicPerformance[topic];
      data.mastery = (data.correct / data.total) * 100;
      data.avgTime = data.avgTime / data.total;
    });

    // Identify weak topics
    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, data]) => data.mastery < 60)
      .sort((a, b) => a[1].mastery - b[1].mastery)
      .slice(0, 5)
      .map(([topic, data]) => ({
        topic,
        mastery: data.mastery,
        attempts: data.total
      }));

    res.json({
      success: true,
      data: {
        topicPerformance,
        timeAnalysis,
        difficultyAnalysis: {
          easy: difficultyAnalysis.easy.total > 0 ?
            (difficultyAnalysis.easy.correct / difficultyAnalysis.easy.total) * 100 : 0,
          medium: difficultyAnalysis.medium.total > 0 ?
            (difficultyAnalysis.medium.correct / difficultyAnalysis.medium.total) * 100 : 0,
          hard: difficultyAnalysis.hard.total > 0 ?
            (difficultyAnalysis.hard.correct / difficultyAnalysis.hard.total) * 100 : 0
        },
        weakTopics,
        totalTests: tests.length,
        averageScore: tests.reduce((acc, t) => acc + t.score.percentage, 0) / tests.length || 0
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate personalized sprint plan
// @route   POST /api/performance/sprint-plan
// @access  Private
exports.generateSprintPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { examDate, focusAreas } = req.body;

    const user = await User.findById(userId);
    const performance = await Performance.findOne({ userId });

    if (!examDate) {
      return res.status(400).json({
        success: false,
        message: 'Exam date is required'
      });
    }

    // Get weak areas from performance data
    const weakAreas = performance.weakAreas.map(wa => wa.topic);
    const areasToFocus = focusAreas || weakAreas;

    // Generate study plan using Groq AI
    const studyPlan = await groqService.generateStudyPlan(
      user.profile,
      examDate,
      areasToFocus
    );

    // Calculate dates for sprint
    const startDate = new Date();
    const endDate = new Date(examDate);
    const daysUntilExam = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Create daily tasks
    const dailyTasks = [];
    const tasksPerWeek = studyPlan.weeklyGoals || [];

    tasksPerWeek.forEach((week, index) => {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (index * 7));

      for (let day = 0; day < 7 && dailyTasks.length < daysUntilExam; day++) {
        const taskDate = new Date(weekStart);
        taskDate.setDate(taskDate.getDate() + day);

        dailyTasks.push({
          date: taskDate,
          tasks: week.dailyTasks || [],
          completed: false
        });
      }
    });

    // Create sprint goals
    const goals = studyPlan.priorityTopics?.map(topic => ({
      description: `Master ${topic}`,
      completed: false,
      dueDate: new Date(startDate.getTime() + (daysUntilExam / studyPlan.priorityTopics.length) * 24 * 60 * 60 * 1000)
    })) || [];

    // Update performance with new sprint plan
    performance.sprintPlan.currentSprint = {
      startDate,
      endDate,
      goals,
      dailyTasks
    };

    await performance.save();

    res.json({
      success: true,
      data: {
        sprint: performance.sprintPlan.currentSprint,
        recommendations: studyPlan.studyTips || [],
        daysUntilExam
      }
    });
  } catch (error) {
    console.error('Sprint plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update sprint progress
// @route   PUT /api/performance/sprint-plan/progress
// @access  Private
exports.updateSprintProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalIndex, taskDate, taskIndex, completed } = req.body;

    const performance = await Performance.findOne({ userId });

    if (!performance.sprintPlan.currentSprint) {
      return res.status(404).json({
        success: false,
        message: 'No active sprint plan found'
      });
    }

    // Update goal progress
    if (goalIndex !== undefined) {
      performance.sprintPlan.currentSprint.goals[goalIndex].completed = completed;
    }

    // Update daily task progress
    if (taskDate && taskIndex !== undefined) {
      const taskDay = performance.sprintPlan.currentSprint.dailyTasks.find(
        dt => new Date(dt.date).toDateString() === new Date(taskDate).toDateString()
      );

      if (taskDay) {
        // Mark entire day as completed if all tasks done
        taskDay.completed = completed;
      }
    }

    await performance.save();

    // Award coins for completing tasks
    if (completed) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'gamification.coins': 5 }
      });
    }

    res.json({
      success: true,
      data: performance.sprintPlan.currentSprint
    });
  } catch (error) {
    console.error('Update sprint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get readiness radar visualization data
// @route   GET /api/performance/readiness-radar
// @access  Private
exports.getReadinessRadar = async (req, res) => {
  try {
    const userId = req.user.id;

    let performance = await Performance.findOne({ userId });
    const user = await User.findById(userId);

    if (!performance) {
      // Create performance record if it doesn't exist
      performance = await Performance.create({
        userId,
        overallReadiness: 0,
        subjectReadiness: [],
        topicMastery: [],
        studyStats: {
          totalStudyTime: 0,
          testsCompleted: 0,
          questionsAttempted: 0,
          averageAccuracy: 0
        }
      });
    }

    // Calculate overall readiness from subject readiness
    const subjectScores = performance.subjectReadiness.map(s => s.readiness);
    const overallReadiness = subjectScores.length > 0
      ? subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length
      : 0;

    performance.overallReadiness = Math.round(overallReadiness);

    // Generate predictions using IRT score
    const irtPercentage = irtService.thetaToPercentage(performance.irtAbility);

    performance.predictions = {
      examScore: Math.round(irtPercentage),
      confidence: performance.studyStats.testsCompleted > 5 ? 'high' :
        performance.studyStats.testsCompleted > 2 ? 'medium' : 'low',
      lastUpdated: new Date()
    };

    await performance.save();

    // Prepare radar chart data
    const radarData = performance.subjectReadiness.map(sr => ({
      subject: sr.subject,
      readiness: sr.readiness,
      trend: sr.trend,
      lastUpdated: sr.lastUpdated
    }));

    res.json({
      success: true,
      data: {
        overallReadiness: performance.overallReadiness,
        radarData,
        predictions: performance.predictions,
        recommendations: performance.weakAreas.slice(0, 3).map(wa => ({
          area: wa.topic,
          severity: wa.severity,
          action: wa.recommendation
        }))
      }
    });
  } catch (error) {
    console.error('Readiness radar error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get YouTube video recommendations based on weak zones
// @route   GET /api/performance/video-recommendations
// @access  Private
exports.getYouTubeRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const performance = await Performance.findOne({ userId });
    const user = await User.findById(userId);

    if (!performance || !performance.subjectReadiness || performance.subjectReadiness.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Identify weak subjects (readiness < 60)
    const weakZones = performance.subjectReadiness
      .filter(s => s.readiness < 60)
      .map(s => ({
        subject: s.subject,
        readiness: s.readiness
      }));

    if (weakZones.length === 0) {
      // If no weak zones, suggest advanced content for the best subject
      const bestSubject = [...performance.subjectReadiness].sort((a, b) => b.readiness - a.readiness)[0];
      weakZones.push({
        subject: bestSubject.subject,
        readiness: bestSubject.readiness,
        isAdvanced: true
      });
    }

    const recommendations = await groqService.getYouTubeRecommendations(
      weakZones,
      user.profile?.class || user.studentClass || '10'
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Video recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};