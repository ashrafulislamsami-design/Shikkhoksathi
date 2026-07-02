const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate mock test questions
 */
exports.generateQuestions = async (subject, topic, classLevel, count, language, difficulty, type = 'mcq', chapter = null) => {
    const isEnglish = subject.toLowerCase() === 'english';
    const isCQ = type === 'cq';

    const prompt = `You are an NCTB Exam Setter. Use specific passages, grammar rules, and vocabulary from the 'English For Today' textbook for Class ${classLevel}.
    
Generate ${count} hard-level ${isCQ ? 'Creative Questions (CQ)' : 'MCQ questions'} strictly following the Bangladesh NCTB syllabus for ${subject}.
Topic: ${topic}
${chapter ? `Chapter: ${chapter}` : ''}
Language: ${isEnglish ? 'strictly English' : language}
Difficulty Level: ${difficulty} (0.8+ is Board Exam Standard)

${isCQ ? `STRICT RULES FOR BROAD ELABORATIVE CREATIVE QUESTIONS (CQ):
- These MUST be "Broad Questions" (Bochumukhi/Creative) requiring analytical elaboration, similar to NCTB Board Exam essay-style questions.
- Each question must be complex, requiring multi-step logical derivations, proofs, or significant prose answers.
- The question should be designed to take exactly 15 minutes for a student to answer in detail.
- STRICTLY NO OPTIONS. This is an open-ended elaborative question.
- The student's answer will be a handwritten image upload.
- The 'explanation' field must contain the complete board-standard sample answer for evaluation.` : `SPECIAL RULES FOR MCQ:
- Provide exactly 4 options per question.
- Ensure exactly one option is correct.`}

${isEnglish && !isCQ ? `SPECIAL RULES FOR ENGLISH MCQ:
- Output strictly in English language. Do NOT translate anything to Bangla.
- Use pattern types like: Gap filling with clues, Rearranging sentences, and Matching tables based on NCTB board exam patterns.
- Ensure options are highly tricky and test minute grammar/context rules.` : ''}

Return a JSON object with a key "questions" containing an array of objects with:
- questionText: string
${!isCQ ? `- options: array of 4 objects { text: string, isCorrect: boolean }` : ''}
- explanation: string (Detailing the step-by-step solution or proof)
- difficulty: number (0.8 to 0.1)

Return ONLY the JSON object. Example: { "questions": [...] }`;

    const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

    for (const model of MODELS) {
        try {
            console.log(`[Groq] Trying model: ${model} for ${count} ${type} questions on ${subject}...`);
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: model,
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 4096
            });

            const content = completion.choices[0].message.content;
            const data = JSON.parse(content);
            let questions = data.questions || data;

            // Ensure questions are returned as an array and have the 'type' field
            if (!Array.isArray(questions)) questions = [questions];

            console.log(`[Groq] Success with ${model}: Generated ${questions.length} questions.`);
            return questions.map(q => {
                const sanitized = { ...q, type };
                if (isCQ) delete sanitized.options; // Strictly remove options for CQ
                return sanitized;
            });
        } catch (error) {
            console.error(`[Groq] Model ${model} failed:`, error.message || error);
            if (error.status === 429) {
                console.warn(`[Groq] Rate limited on ${model}. Waiting 2s before next model...`);
                await new Promise(r => setTimeout(r, 2000));
            }
            // Try next model
        }
    }

    console.error('[Groq] All models failed for generateQuestions.');
    return [];
};

/**
 * Evaluate a Creative Question (CQ) answer image
 * Uses AI to simulate OCR and evaluation of handwritten/captured proof
 */
exports.evaluateCQ = async (questionText, studentAnswerImage, expectedSolution) => {
    // Process image: Ensure it's in the correct format for Groq Vision
    // studentAnswerImage is expected to be a data URL (base64)

    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `You are an expert NCTB examiner. Perform OCR on this student's handwritten answer image and evaluate it against the question.
    
Question: ${questionText}
Expected Solution/Proof: ${expectedSolution}

Rigorous Evaluation Criteria:
1. Extract text/calculations from the image (OCR).
2. Compare logic, steps, and final result with the expected solution.
3. Award marks out of 5.
4. Provide constructive remarks identifying specific errors or praising good logic.

Return a JSON object with:
- marks: number (out of 5)
- isCorrect: boolean (true if marks >= 3)
- remarks: string (detailed feedback)`
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: studentAnswerImage // This is the base64 data URL
                    }
                }
            ]
        }
    ];

    try {
        const completion = await groq.chat.completions.create({
            messages,
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Groq evaluateCQ error:', error);
        return { marks: 0, isCorrect: false, remarks: "Vision Analysis failed. Please ensure the image is clear and try again." };
    }
};

/**
 * Analyze student performance and provide feedback
 */
exports.analyzePerformance = async (performanceData, userProfile) => {
    const prompt = `Analyze this student's performance:
Data: ${JSON.stringify(performanceData)}
Profile: ${JSON.stringify(userProfile)}

Provide a concise feedback summary with:
- strengths: array of strings
- improvements: array of strings
- focusRecommendation: string

Return ONLY JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Groq analyzePerformance error:', error);
        return { strengths: [], improvements: [], focusRecommendation: 'Keep studying!' };
    }
};

/**
 * Generate a personalized study plan
 */
exports.generateStudyPlan = async (userProfile, examDate, focusAreas) => {
    const prompt = `Create a study plan for:
Profile: ${JSON.stringify(userProfile)}
Exam Date: ${examDate}
Focus Areas: ${JSON.stringify(focusAreas)}

Provide:
- weeklyGoals: array of { week: number, dailyTasks: array }
- priorityTopics: array
- studyTips: array

Return ONLY JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Groq generateStudyPlan error:', error);
        return { weeklyGoals: [], priorityTopics: focusAreas, studyTips: [] };
    }
};
/**
 * Generate career guidance roadmap
 */
exports.generateCareerGuidance = async (userProfile, performanceData) => {
    const prompt = `Role: ShikshaAI Career Engine (Academic Counselor for Bangladesh).
Input:
- Profile: ${JSON.stringify(userProfile)}
- Performance: ${JSON.stringify(performanceData)}

Task: Analyze "Strong Zone" (best subjects) and Soft Skills.
1. Recommend ONE best-fit career path.
2. Calculate Match Score (%).
3. Generate a 3-Step Roadmap (Academic -> Skills -> Employment).

Output JSON Schema (Strict):
{
  "careerTitle": "string",
  "matchBadge": "string (e.g., '85% Match')",
  "description": "string (max 10 words, action-oriented)",
  "metrics": {
    "duration": "string (e.g., '4 Years')",
    "salary": "string (e.g., '৳35,000 - ৳50,000/month')",
    "demand": "string (Low/Medium/High/Very High)",
    "matchScore": "string (e.g., '85%')"
  },
  "roadmap": [
    {
      "step": 1,
      "title": "string",
      "tag": "string (e.g., 'SSC/HSC')",
      "duration": "string",
      "requirements": ["string", "string"],
      "resources": ["string", "string"]
    },
    {
      "step": 2,
      "title": "string",
      "tag": "string (e.g., 'Undergrad/Training')",
      "duration": "string",
      "requirements": ["string", "string"],
      "resources": ["string", "string"]
    },
    {
      "step": 3,
      "title": "string",
      "tag": "string (e.g., 'Employment')",
      "duration": "string",
      "requirements": ["string", "string"],
      "resources": ["string", "string"]
    }
  ],
  "skillAnalysis": [
    {
      "skill": "string (Subject/Skill)",
      "priority": "string (HIGH/MEDIUM/LOW)",
      "reason": "string",
      "currentLevel": "number",
      "targetLevel": "number",
      "recommendations": ["string", "string"]
    }
  ]
}

Context: Use Bangladeshi currency (BDT), local exams (SSC, HSC), and job markets. Return ONLY JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Groq generateCareerGuidance error:', error);
        return null;
    }
};
/**
 * Analyze skill gaps using AI
 */
exports.analyzeSkillGaps = async (performanceData, userProfile) => {
    const prompt = `Role: ShikshaAI Skill Analyzer.
Input:
- Performance: ${JSON.stringify(performanceData)}
- Profile: ${JSON.stringify(userProfile)}

Task: Analyze student performance and categorize skills into priority levels.
HIGH PRIORITY: Skills where readiness < 50% or critical core subjects.
MEDIUM PRIORITY: Readiness 50-70%.
LOW PRIORITY: Readiness > 70% or elective skills.

Output JSON Format:
{
  "skills": [
    {
      "skill": "Subject/Skill Name",
      "priority": "HIGH/MEDIUM/LOW",
      "category": "Academic/Soft Skill/Technical",
      "currentLevel": number,
      "targetLevel": number,
      "recommendations": ["Actionable step 1", "Actionable step 2"]
    }
  ]
}

Return ONLY JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        const data = JSON.parse(completion.choices[0].message.content);
        return data.skills || [];
    } catch (error) {
        console.error('Groq analyzeSkillGaps error:', error);
        return [];
    }
};
/**
 * Generate YouTube video recommendations based on weak zones
 */
exports.getYouTubeRecommendations = async (weakZones, classLevel) => {
    const prompt = `Role: ShikshaAI Educational Content Curator.
Input:
- Weak Subjects/Topics: ${JSON.stringify(weakZones)}
- Student Class: Class ${classLevel} (NCTB Syllabus)

Task: Recommend specific YouTube search queries or channels that help master these weak areas.
Focus on highly reputable Bangladeshi educational channels (e.g., 10 Minute School, Shikho, Onnorokom Pathshala) or global standards if applicable.

Output JSON Format (Strict):
{
  "recommendations": [
    {
      "subject": "string",
      "topic": "string",
      "title": "string (e.g., Master Trigonometry in 20 Mins)",
      "searchQuery": "string (The exact string to search on YouTube)",
      "channelSuggestion": "string",
      "reason": "string (Max 15 words)"
    }
  ]
}

Return ONLY JSON. Provide 3-5 high-quality recommendations total.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });

        const data = JSON.parse(completion.choices[0].message.content);
        return data.recommendations || [];
    } catch (error) {
        console.error('Groq getYouTubeRecommendations error:', error);
        return [];
    }
};
