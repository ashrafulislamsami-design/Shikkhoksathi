const Groq = require('groq-sdk');
const Lesson = require('../models/Lesson');
const IEP = require('../models/IEP');

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Generate AI Lesson Plan
exports.generateLesson = async (req, res) => {
  try {
    const { teacherId, classLevel, subject, topic, duration, struggles, language } = req.body;

    // Validate required fields
    if (!teacherId || !classLevel || !subject || !topic || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create AI prompt - Removed rigid class/subject labels from output requirement
    const prompt = `You are an expert Bangladeshi teacher trainer. Create a detailed, culturally relevant lesson plan for the following topic:

Topic: ${topic}
${classLevel ? `Target Class: ${classLevel}` : ''}
${subject ? `Subject Area: ${subject}` : ''}
Duration: ${duration} minutes
${struggles ? `Common Student Challenges to address: ${struggles}` : ''}
Language Preference: ${language || 'Both English and Bengali (Bilingual)'}

Create a comprehensive lesson plan and use the following format for section headers: **SECTION NAME** (e.g., **LEARNING OBJECTIVES**, **ASSESSMENT QUESTIONS**).

Include these sections:
- **LEARNING OBJECTIVES** (3-4 SMART goals)
- **MATERIALS NEEDED**
- **LESSON STRUCTURE** (Intro, Main Teaching, Practice, Conclusion)
- **ENGAGING ACTIVITIES** (3 hands-on examples in Bangladeshi context)
- **COMMON MISCONCEPTIONS**
- **DIFFERENTIATION STRATEGIES**
- **ASSESSMENT QUESTIONS** (Easy, Medium, Challenging)
- **HOMEWORK/EXTENSION ACTIVITY**

Format clearly with headers in bold (using double asterisks). Ensure the format is clean and professional.`;

    let generatedPlan = '';
    let attempts = 0;
    const maxAttempts = 3;
    let isValid = false;

    while (attempts < maxAttempts && !isValid) {
      attempts++;
      console.log(`Generation attempt ${attempts} for topic: ${topic}`);

      // Call Groq AI
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
      });

      generatedPlan = chatCompletion.choices[0].message.content;

      // Remove all '#' characters as requested
      generatedPlan = generatedPlan.replace(/#/g, '');

      isValid = validateLessonPlan(generatedPlan);

      if (!isValid && attempts < maxAttempts) {
        console.warn(`Attempt ${attempts} failed validation. Retrying...`);
      }
    }

    if (!isValid) {
      console.error(`Failed to generate a valid lesson plan after ${maxAttempts} attempts.`);
      // We still return what we have, but maybe with a warning or just let it through if it's "good enough" for some sections
    }

    // Extract structured data from AI response (simplified parsing)
    const objectives = extractSection(generatedPlan, 'Learning Objectives', 'Materials Needed');
    const materials = extractSection(generatedPlan, 'Materials Needed', 'Lesson Structure');

    // Save to database
    const lesson = new Lesson({
      teacherId,
      classLevel,
      subject,
      topic,
      duration,
      generatedPlan,
      objectives: objectives ? objectives.split('\n').filter(line => line.trim()) : [],
      materials: materials ? materials.split('\n').filter(line => line.trim()) : []
    });

    await lesson.save();

    res.status(201).json({
      success: true,
      message: isValid ? 'Lesson plan generated successfully!' : 'Lesson plan generated with some missing sections.',
      data: lesson,
      attempts: attempts
    });

  } catch (error) {
    console.error('Error generating lesson:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: 'Error generating lesson plan',
      error: error.message
    });
  }
};

// Helper function to validate lesson plan quality
function validateLessonPlan(plan) {
  if (!plan || plan.length < 500) return false;

  const requiredSections = [
    'Learning Objectives',
    'Materials Needed',
    'Lesson Structure',
    'Assessment Questions'
  ];

  const missingSections = requiredSections.filter(section => !plan.includes(section));

  if (missingSections.length > 0) {
    console.log('Missing sections:', missingSections);
    return false;
  }

  return true;
}

// Helper function to extract sections
function extractSection(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';

  const endIndex = endMarker ? text.indexOf(endMarker, startIndex + startMarker.length) : text.length;

  let sectionContent = '';
  if (endIndex === -1) {
    sectionContent = text.substring(startIndex + startMarker.length).trim();
  } else {
    sectionContent = text.substring(startIndex + startMarker.length, endIndex).trim();
  }

  // Clean up markdown formatting
  return sectionContent
    .replace(/^[:\s*-]+/, '') // Remove leading colons, spaces, stars, dashes
    .replace(/\*\*+/g, '')    // Remove bold markers
    .trim();
}

// Get all lessons for a teacher
exports.getTeacherLessons = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const lessons = await Lesson.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lessons',
      error: error.message
    });
  }
};

// Get single lesson
exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lesson',
      error: error.message
    });
  }
};

// Delete lesson
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting lesson',
      error: error.message
    });
  }
};

// Generate IEP
exports.generateIEP = async (req, res) => {
  try {
    const { studentId, diagnosis, strengths, weaknesses, teacherId } = req.body;

    if (!studentId || !diagnosis || !strengths || !weaknesses || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: studentId, diagnosis, strengths, weaknesses, teacherId'
      });
    }

    const prompt = `You are a special education expert in Bangladesh. Create a concise Individualized Education Plan (IEP) for:

**Student ID:** ${studentId}
**Diagnosis:** ${diagnosis}
**Strengths:** ${strengths}
**Weaknesses:** ${weaknesses}

Create an IEP with:
1. **SMART Goals** (3-5 specific, measurable goals)
2. **Alignment Note:** Explicitly state how this plan aligns with the Bangladesh Rights of Persons with Disabilities Act 2013.

Format clearly with headers.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    const generatedPlan = chatCompletion.choices[0].message.content;
    const goals = extractListItems(generatedPlan, 'SMART Goals');

    const iep = new IEP({
      studentId,
      teacherId,
      diagnosis,
      strengths,
      weaknesses,
      smartGoals: goals,
      complianceFlag: true
    });

    await iep.save();

    res.status(201).json({
      success: true,
      message: 'IEP generated successfully!',
      data: iep,
      fullDraft: generatedPlan
    });

  } catch (error) {
    console.error('Error generating IEP:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating IEP',
      error: error.message
    });
  }
};

// Get Classroom Pulse
exports.getClassroomPulse = async (req, res) => {
  try {
    const { topic, performanceData } = req.body; // performanceData is an array of { studentId, result: 'correct' | 'incorrect' }

    if (!topic || !performanceData || !Array.isArray(performanceData)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide topic and performanceData array'
      });
    }

    const totalStudents = performanceData.length;
    const failures = performanceData.filter(d => d.result === 'incorrect').length;
    const failureRate = (failures / totalStudents) * 100;

    if (failureRate > 60) {
      // Use AI to suggest a remedial activity
      const prompt = `Topic: ${topic}
Failure Rate: ${failureRate.toFixed(1)}%
The class is struggling with this topic. Provide ONE short, highly engaging remedial activity specifically for Bangladeshi students to help them understand this topic better.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
      });

      const suggestion = chatCompletion.choices[0].message.content;

      return res.status(200).json({
        success: true,
        type: 'Pivot Alert',
        topic,
        failureRate: `${failureRate.toFixed(1)}%`,
        message: 'High failure rate detected. A pivot in teaching strategy is recommended.',
        suggestedRemedialActivity: suggestion
      });
    }

    res.status(200).json({
      success: true,
      topic,
      failureRate: `${failureRate.toFixed(1)}%`,
      message: 'Class performance is within acceptable limits.'
    });

  } catch (error) {
    console.error('Error getting pulse:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing classroom pulse',
      error: error.message
    });
  }
};

// Additional helper for IEP list extraction
function extractListItems(text, sectionTitle) {
  const startIndex = text.indexOf(sectionTitle);
  if (startIndex === -1) return [];

  const section = text.substring(startIndex).split('##')[0];
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.match(/^[-*•]\s+|^\d+\.\s+/) || line.length > 10)
    .map(line => line.replace(/^[-*•]\s+|^\d+\.\s+/, '').replace(/\*\*+/g, '').trim())
    .filter(line => line.length > 0 && !line.includes(sectionTitle))
    .slice(0, 5);

}

// Generate Micro-Intervention
exports.generateMicroIntervention = async (req, res) => {
  try {
    const { studentName, subject, score, topic } = req.body;

    if (!studentName || !subject || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentName, subject, and score'
      });
    }

    const prompt = `You are a helpful teacher mentor.
Student: ${studentName}
Subject: ${subject}
Topic: ${topic || 'General'}
Current Score: ${score}% (Struggling)

Provide a "Quick Tip": A very simple, easy-to-understand 3-step guide for the teacher to help this student right now.
Use simple English. Avoid complex words.

Focus on:
1. One friendly check-in question.
2. One simple concept explanation.
3. One easy practice task.

Format:
Step 1: [Simple Action]
Step 2: [Simple Action]
Step 3: [Simple Action]`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    const intervention = chatCompletion.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: intervention
    });

  } catch (error) {
    console.error('Error generating intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating intervention',
      error: error.message
    });
  }
};
