const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const Performance = require('../models/Performance');
const User = require('../models/User');
const CoinTransaction = require('../models/Coin');
const groqService = require('../services/groqService');
const irtService = require('../services/irtService');
const gamificationController = require('./gamificationController');

// @desc    Generate a new mock test
// @route   POST /api/mock-tests/generate
// @access  Private
exports.generateMockTest = async (req, res) => {
  try {
    const userId = req.user.id;
    let { testType = 'topic_specific', subject, topic = 'General', chapter, questionType = 'mcq', classLevel, class: classAlias, questionCount = 10, language } = req.body;
    classLevel = classLevel || classAlias;

    // Enforce CQ limits
    if (questionType === 'cq') {
      questionCount = Math.min(questionCount, 5);
    }

    // 1. SUBJECT MAPPING & CASE-INSENSITIVE MATCHING
    const subjectMap = {
      'mathematics': 'Math',
      'math': 'Math',
      'science': 'Science',
      'english': 'English',
      'bangla': 'Bangla',
      'social science': 'Social Science',
      'ict': 'ICT'
    };

    const originalSubject = subject;
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    // Normalize subject for matching
    const normalizedInput = subject.toLowerCase().trim();
    subject = subjectMap[normalizedInput] || subject;

    // 2. USER PROFILE FALLBACKS
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    classLevel = classLevel || user.profile?.class || '10';
    language = language || user.profile?.preferredLanguage || 'english';

    console.log(`Generating test: User=${userId}, Subject=${originalSubject}->${subject}, Topic=${topic}, Class=${classLevel}, Lang=${language}`);

    // Get user's current ability level
    const performance = await Performance.findOne({ userId });
    const initialTheta = performance?.irtAbility || 0;

    // 3. ADAPTIVE DIFFICULTY LOGIC (ParikshaPro Core)
    // Check subject-specific readiness if available, otherwise use overall theta
    const subjectReadiness = performance?.subjectReadiness?.find(s => s.subject === subject)?.readiness || irtService.thetaToPercentage(initialTheta);

    let requestedDifficulty = irtService.getAdaptiveDifficulty(initialTheta, 0, 0);

    if (subjectReadiness > 80) {
      console.log(`High readiness (${subjectReadiness}%). Shifting to Board Exam Standard (Hard).`);
      requestedDifficulty = Math.max(0.8, requestedDifficulty); // Force Board standard
    }

    // 4. CROSS-CLASS DIFFICULTY SCALING (Smart Configurator)
    const userClass = parseInt(user.profile?.class || user.classLevel || 10);
    const targetClass = parseInt(classLevel);
    let difficultyMultiplier = 1.0;

    if (targetClass > userClass) {
      console.log(`🚀 CHALLENGE MODE: Class ${userClass} -> ${targetClass}. Boosting difficulty & rewards.`);
      requestedDifficulty = 0.95; // Expert/Olympiad Level
      difficultyMultiplier = 1.5;
    } else if (targetClass < userClass) {
      console.log(`📚 REMEDIAL MODE: Class ${userClass} -> ${targetClass}. Lowering difficulty & rewards.`);
      requestedDifficulty = 0.5; // Basic/Remedial Level
      difficultyMultiplier = 0.5;
    }

    // Generate questions using Groq
    let questions = [];

    // 4. CACHE-FIRST RANDOMIZED STRATEGY (ParikshaPro Refined)
    console.log(`Checking cache for Subject: ${subject}, Class: ${classLevel}, Topic: ${topic}`);

    // Build aggregation pipeline for randomization
    let matchStage = { subject, class: classLevel };
    if (topic && topic !== 'General') {
      matchStage.topic = topic;
    }
    if (chapter) {
      matchStage.topic = chapter; // Assuming topic maps to chapter for now if chapter is provided
    }
    matchStage.type = questionType;

    let existingQuestions = await Question.aggregate([
      { $match: matchStage },
      { $sample: { size: questionCount } }
    ]);

    // fall-through: if specific topic returned nothing, try general subject questions
    if (existingQuestions.length === 0 && topic && topic !== 'General') {
      console.log(`No questions for topic [${topic}]. Falling back to [${subject}] general questions.`);
      matchStage = { subject, class: classLevel };
      existingQuestions = await Question.aggregate([
        { $match: matchStage },
        { $sample: { size: questionCount } }
      ]);
    }

    if (existingQuestions.length < questionCount) {
      const neededCount = questionCount - existingQuestions.length;
      console.log(`Cache miss: Needed ${neededCount} more questions. Calling Groq...`);

      // Request with a buffer to handle incomplete Groq responses
      const requestCount = Math.ceil(neededCount * 1.1); // Request 10% extra to compensate for incomplete responses
      let generatedQuestions = await groqService.generateQuestions(
        subject,
        topic,
        classLevel,
        requestCount,
        language,
        requestedDifficulty,
        questionType,
        chapter
      );

      // If we still don't have enough questions, retry once
      if (generatedQuestions.length < neededCount) {
        const retryCount = neededCount - generatedQuestions.length;
        console.log(`Groq returned ${generatedQuestions.length} questions (needed ${neededCount}). Retrying ${retryCount} more...`);
        const retryQuestions = await groqService.generateQuestions(
          subject,
          topic,
          classLevel,
          retryCount,
          language,
          requestedDifficulty,
          questionType,
          chapter
        );
        if (retryQuestions && retryQuestions.length > 0) {
          generatedQuestions = [...generatedQuestions, ...retryQuestions];
        }
      }

      // Save generated questions to database
      if (generatedQuestions && generatedQuestions.length > 0) {
        for (const gq of generatedQuestions) {
          try {
            // Validate required fields
            if (!gq.questionText) {
              console.warn('Skipping question: Missing questionText field.');
              continue;
            }

            // For MCQ, options are required; for CQ, they are not
            const isCQ = (gq.type || questionType) === 'cq';
            if (!isCQ && (!Array.isArray(gq.options) || gq.options.length === 0)) {
              console.warn('Skipping MCQ question: Missing or invalid options array.');
              continue;
            }

            const question = await Question.create({
              subject,
              topic: topic || 'General',
              class: classLevel,
              questionText: {
                bangla: gq.questionText?.bangla || (language === 'bangla' ? (typeof gq.questionText === 'string' ? gq.questionText : '') : ''),
                english: gq.questionText?.english || (language === 'english' ? (typeof gq.questionText === 'string' ? gq.questionText : '') : '')
              },
              type: gq.type || questionType,
              options: isCQ
                ? []
                : gq.options.map(opt => ({
                  bangla: opt.bangla || (language === 'bangla' ? (opt.text || String(opt)) : ''),
                  english: opt.english || (language === 'english' ? (opt.text || String(opt)) : ''),
                  isCorrect: !!opt.isCorrect
                })),
              explanation: {
                bangla: gq.explanation?.bangla || (language === 'bangla' ? (typeof gq.explanation === 'string' ? gq.explanation : '') : ''),
                english: gq.explanation?.english || (language === 'english' ? (typeof gq.explanation === 'string' ? gq.explanation : '') : '')
              },
              difficulty: gq.difficulty || requestedDifficulty,
              discrimination: 1.0,
              guessing: 0.25,
              source: 'generated'
            });
            questions.push(question);
          } catch (createErr) {
            console.error('Failed to create question entry:', createErr.message);
          }
        }
      }

      // Merge with existing
      questions = [...existingQuestions, ...questions];
    } else {
      console.log(`Cache hit: Using ${existingQuestions.length} existing questions.`);
      questions = existingQuestions;
    }

    // 3. FINAL SAFETY CHECK
    if (!questions || questions.length === 0) {
      console.error(`[CRITICAL] Generation failed for Subject=${subject}, Topic=${topic}. Questions array is empty.`);
      return res.status(503).json({
        success: false,
        message: 'Unable to generate questions for this topic at the moment. Please try a different subject or topic.'
      });
    }

    // Create mock test
    const mockTest = await MockTest.create({
      userId,
      testType,
      subject,
      class: classLevel,
      chapter: chapter,
      questions: questions.slice(0, questionCount).map(q => ({
        questionId: q._id,
        difficultyAtTime: q.difficulty
      })),
      timing: {
        startedAt: new Date(),
        timeLimit: questionType === 'cq' ? (questionCount * 15 * 60) : (questionCount * 60)
      },
      settings: {
        language,
        questionType,
        showExplanations: true,
        allowPause: true,
        difficultyMultiplier: difficultyMultiplier
      },
      status: 'in_progress'
    });

    // Return first question
    const firstQuestion = questions[0];
    const languageToUse = firstQuestion.questionText[language] ? language : Object.keys(firstQuestion.questionText)[0];

    res.status(201).json({
      success: true,
      test: mockTest,
      testId: mockTest._id, // Direct access for convenience
      data: {
        testId: mockTest._id,
        totalQuestions: Math.min(questions.length, questionCount),
        currentQuestion: 1,
        question: {
          id: firstQuestion._id,
          text: firstQuestion.questionText[languageToUse] || "Question text unavailable",
          options: firstQuestion.type === 'mcq'
            ? firstQuestion.options.map(opt => ({
              text: opt[languageToUse] || "Option text unavailable",
              id: opt._id
            }))
            : [],
          type: firstQuestion.type,
          explanation: firstQuestion.type === 'cq' ? firstQuestion.explanation[languageToUse] : null
        },
        timeLimit: mockTest.timing.timeLimit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Assessment Engine Error: ' + error.message,
      diagnostic: 'Check backend console logs or GROQ_API_KEY'
    });
  }
};

// @desc    Get next question in adaptive test
// @route   POST /api/mock-tests/:testId/next-question
// @access  Private
exports.getNextQuestion = async (req, res) => {
  try {
    const { testId } = req.params;
    const mockTest = await MockTest.findById(testId).populate('questions.questionId');

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    if (mockTest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Test already completed'
      });
    }

    // Find next unanswered question
    const answeredCount = mockTest.questions.filter(q => q.userAnswer !== undefined).length;

    if (answeredCount >= mockTest.questions.length) {
      return res.json({
        success: true,
        data: {
          completed: true,
          message: 'All questions answered'
        }
      });
    }

    const nextQuestion = mockTest.questions[answeredCount].questionId;
    const language = mockTest.settings.language;

    res.json({
      success: true,
      data: {
        testId: mockTest._id,
        currentQuestion: answeredCount + 1,
        totalQuestions: mockTest.questions.length,
        question: {
          id: nextQuestion._id,
          text: nextQuestion.questionText[language],
          options: nextQuestion.options.map(opt => ({
            text: opt[language],
            id: opt._id
          })),
          type: nextQuestion.type,
          explanation: nextQuestion.type === 'cq' ? nextQuestion.explanation[language] : null
        }
      }
    });
  } catch (error) {
    console.error('Get next question error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit answer for a question
// @route   POST /api/mock-tests/:testId/submit-answer
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questionId, answer, timeSpent } = req.body;

    const mockTest = await MockTest.findById(testId).populate('questions.questionId');

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Find the question in the test
    const questionIndex = mockTest.questions.findIndex(
      q => q.questionId._id.toString() === questionId
    );

    if (questionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this test'
      });
    }

    const question = mockTest.questions[questionIndex].questionId;


    // Check if answer is correct
    let isCorrect = false;
    let correctOption = null;

    if (question.type === 'mcq') {
      correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption) {
        isCorrect = correctOption._id.toString() === answer.toString();
        console.log(`[DEBUG] Question: ${questionId}, UserAnswer: ${answer}, CorrectAnswer: ${correctOption._id}, isCorrect: ${isCorrect}`);
      } else {
        console.warn(`[WARN] Question ${questionId} has no correct option defined.`);
      }
    } else if (question.type === 'cq') {
      // For CQ, answer is an image URL or data
      const evaluation = await groqService.evaluateCQ(
        question.questionText[mockTest.settings.language],
        answer,
        question.explanation[mockTest.settings.language]
      );
      isCorrect = evaluation.isCorrect;
      mockTest.questions[questionIndex].marks = evaluation.marks;
      mockTest.questions[questionIndex].remarks = evaluation.remarks;
    }

    // Update question with answer
    mockTest.questions[questionIndex].userAnswer = answer;
    mockTest.questions[questionIndex].isCorrect = isCorrect;
    mockTest.questions[questionIndex].timeSpent = timeSpent;

    // IMPORTANT: Mongoose doesn't always detect changes inside arrays of subdocuments
    mockTest.markModified('questions');
    await mockTest.save();

    // Return feedback
    const language = mockTest.settings.language;
    res.json({
      success: true,
      data: {
        isCorrect,
        marks: mockTest.questions[questionIndex].marks,
        remarks: mockTest.questions[questionIndex].remarks,
        explanation: mockTest.settings.showExplanations ? question.explanation[language] : null,
        correctAnswerId: correctOption ? correctOption._id : null,
        correctAnswer: correctOption ? (correctOption[language] || correctOption.text) : null
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete mock test and get results
// @route   POST /api/mock-tests/:testId/complete
// @access  Private
exports.completeMockTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;

    const mockTest = await MockTest.findById(testId).populate('questions.questionId');

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    // Calculate score
    const correctAnswers = mockTest.questions.filter(q => q.isCorrect).length;
    const totalQuestions = mockTest.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Calculate IRT score
    const responses = mockTest.questions.map(q => q.isCorrect ? 1 : 0);
    const questions = mockTest.questions.map(q => q.questionId);

    let performance = await Performance.findOne({ userId });

    // If performance doesn't exist, create it
    if (!performance) {
      performance = await Performance.create({
        userId,
        irtAbility: 0,
        studyStats: {
          totalStudyTime: 0,
          questionsAttempted: 0,
          averageAccuracy: 0,
          testsCompleted: 0
        },
        subjectReadiness: []
      });
    }

    const currentTheta = isNaN(performance.irtAbility) ? 0 : (performance.irtAbility || 0);
    const irtScoreProcessed = irtService.estimateAbility(responses, questions, currentTheta);
    const irtScore = isNaN(irtScoreProcessed) ? currentTheta : irtScoreProcessed;

    // Update mock test
    mockTest.score = {
      raw: correctAnswers,
      percentage,
      irtScore
    };
    mockTest.timing.completedAt = new Date();
    mockTest.timing.totalTime = Math.floor((mockTest.timing.completedAt - mockTest.timing.startedAt) / 1000);
    mockTest.status = 'completed';


    // Get AI feedback (fail-safe)
    let feedback = { focusRecommendation: "Great effort! Review your weak areas in the dashboard analysis." };
    try {
      const user = await User.findById(userId);
      if (user) {
        const aiFeedback = await groqService.analyzePerformance(
          {
            score: mockTest.score,
            questions: mockTest.questions,
            timing: mockTest.timing
          },
          user.profile || {}
        );
        if (aiFeedback) feedback = aiFeedback;
      }
    } catch (err) {
      console.warn('AI Feedback Engine Error:', err);
    }
    mockTest.feedback = feedback;
    await mockTest.save();

    // Update performance
    performance.irtAbility = irtScore;

    // Ensure studyStats fields exist to avoid NaN
    if (!performance.studyStats) {
      performance.studyStats = { testsCompleted: 0, questionsAttempted: 0, averageAccuracy: 0, totalStudyTime: 0 };
    }

    performance.studyStats.testsCompleted = (performance.studyStats.testsCompleted || 0) + 1;
    performance.studyStats.questionsAttempted = (performance.studyStats.questionsAttempted || 0) + totalQuestions;
    performance.studyStats.lastActiveDate = new Date();

    const prevTests = Math.max(0, performance.studyStats.testsCompleted - 1);
    const prevAccuracy = performance.studyStats.averageAccuracy || 0;
    const prevTotal = prevAccuracy * prevTests;
    const currentAvgAccuracy = (prevTotal + percentage) / performance.studyStats.testsCompleted;
    performance.studyStats.averageAccuracy = isNaN(currentAvgAccuracy) ? percentage : Math.round(currentAvgAccuracy);

    // Update subject readiness - Ensure array exists
    if (!performance.subjectReadiness) performance.subjectReadiness = [];

    const subjectIndex = performance.subjectReadiness.findIndex(s => s.subject === mockTest.subject);
    const readinessScore = irtService.thetaToPercentage(irtScore);

    if (subjectIndex !== -1) {
      performance.subjectReadiness[subjectIndex].readiness = readinessScore;
      performance.subjectReadiness[subjectIndex].lastUpdated = new Date();
    } else {
      performance.subjectReadiness.push({
        subject: mockTest.subject || 'General',
        readiness: readinessScore,
        lastUpdated: new Date()
      });
    }

    // Use markModified if updating array elements by index
    performance.markModified('subjectReadiness');
    performance.markModified('studyStats');
    await performance.save();

    // CENTRALIZED SCORING ENGINE (Gamification integration)
    let coinsEarned = 0;
    try {
      const isDailyChallenge = (mockTest.testType === 'daily_challenge' || mockTest.testType === 'challenge');
      const scoreResult = await gamificationController.updateScore(userId, correctAnswers, totalQuestions, isDailyChallenge);
      if (scoreResult) coinsEarned = scoreResult.coinsEarned;
    } catch (gamifErr) {
      console.warn('Gamification Update System Error:', gamifErr);
    }

    res.json({
      success: true,
      data: {
        score: mockTest.score,
        feedback: mockTest.feedback,
        coinsEarned,
        timing: mockTest.timing,
        detailedResults: mockTest.questions.map(q => ({
          question: q.questionId?.questionText?.[mockTest.settings?.language || 'english'] || "Question Hidden",
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
          marks: q.marks,
          remarks: q.remarks,
          timeSpent: q.timeSpent || 0
        }))
      }
    });
  } catch (error) {
    console.error('Complete mock test error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get mock test history
// @route   GET /api/mock-tests/history
// @access  Private
exports.getMockTestHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;

    const mockTests = await MockTest.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('subject class score timing createdAt');

    const total = await MockTest.countDocuments({ userId, status: 'completed' });

    res.json({
      success: true,
      data: {
        tests: mockTests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Mock Test Hub Dashboard Data (Stats, History, Analytics)
// @route   GET /api/tests/hub-data
// @access  Private
exports.getMockTestHubData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // 1. Fetch Performance for Stats & Radar
    let performance = await Performance.findOne({ userId });

    // Create default performance if not exists
    if (!performance) {
      performance = await Performance.create({
        userId,
        subjectReadiness: [],
        studyStats: { totalStudyTime: 0, lessonsCompleted: 0, averageAccuracy: 0, testsCompleted: 0, streak: 0 }
      });
    }

    // 2. Fetch Recent Test History
    const history = await MockTest.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject score difficultyAtTime createdAt settings.difficultyMultiplier');

    // 3. Calculate Stats
    const stats = {
      totalTests: performance.studyStats.testsCompleted || 0,
      averageScore: performance.studyStats.averageAccuracy || 0,
      streak: performance.studyStats.streak || 0,
      points: user.gamification?.coins || 0
    };

    // 4. Format Performance Data for Radar Chart
    // Default subjects if empty
    const coreSubjects = ['Math', 'Science', 'English', 'ICT', 'Bangla'];
    let radarData = performance.subjectReadiness.map(s => ({
      subject: s.subject,
      A: Math.round(s.readiness),
      fullMark: 100
    })) || [];

    // Fill missing core subjects with 20 (baseline)
    coreSubjects.forEach(subj => {
      if (!radarData.find(d => d.subject === subj)) {
        radarData.push({ subject: subj, A: 20, fullMark: 100 });
      }
    });

    // 5. Daily Challenge Status (Mock logic for now - check if ONE exists for today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyChallenge = await MockTest.findOne({
      userId,
      testType: 'daily_challenge',
      createdAt: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        stats,
        history: history.map(test => ({
          id: test._id,
          date: new Date(test.createdAt).toLocaleDateString(),
          subject: test.subject,
          topic: 'General', // TODO: Save topic in MockTest model if needed
          score: test.score?.percentage || 0,
          difficulty: (test.settings?.difficultyMultiplier || 1) > 1 ? 'Hard' : (test.settings?.difficultyMultiplier || 1) < 1 ? 'Easy' : 'Medium'
        })),
        performanceData: radarData,
        dailyChallengeCompleted: !!dailyChallenge
      }
    });

  } catch (error) {
    console.error('Hub Data Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get specific mock test
// @route   GET /api/mock-tests/:testId
// @access  Private
exports.getMockTestById = async (req, res) => {
  try {
    const { testId } = req.params;

    const mockTest = await MockTest.findById(testId).populate('questions.questionId');

    if (!mockTest) {
      return res.status(404).json({
        success: false,
        message: 'Mock test not found'
      });
    }

    res.json({
      success: true,
      data: mockTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};