const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const Question = require('../models/Question');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MONGODB_URI = process.env.MONGODB_URI;

const topics = [
    { class: '10', subject: 'Math', chapter: 'Chapter 13: Finite Series' },
    { class: '10', subject: 'Math', chapter: 'Chapter 16: Mensuration' },
    { class: '10', subject: 'Math', chapter: 'Chapter 11: Algebraic Ratio' },
    { class: '10', subject: 'Science', chapter: 'Chapter 12: Electricity' },
    { class: '10', subject: 'Science', chapter: 'Chapter 5: Light' },
    { class: '8', subject: 'English', chapter: 'Prefix & Suffix' },
    { class: '8', subject: 'English', chapter: 'Transformation of Sentences' }
];

async function generateQuestionsBatch(classLevel, subject, chapter) {
    const isEnglish = subject.toLowerCase() === 'english';

    let prompt;

    if (isEnglish) {
        // English-only prompt with strict monolingual output
        prompt = `You are an expert English teacher. Output strictly in English. Do NOT translate to Bangla. Use English For Today Class 9-10 context.

Generate 10 hard-level MCQ questions for Class ${classLevel}, Subject ${subject}, Chapter ${chapter}. Options must be tricky.

Use pattern types like: Gap filling with clues, Rearranging sentences, and Matching tables based on NCTB board exam patterns.

Return purely valid JSON as an object with a "questions" array. Each object must have:
- questionText: string (English only)
- options: array of 4 objects { text: string (English only), isCorrect: boolean }
- correctAnswer: string (English only)
- explanation: string (English only)
- difficulty: number (exactly 0.8 to 0.95 for board standard)

Return ONLY the JSON.`;
    } else {
        // Bilingual prompt for Math/Science
        prompt = `You are an NCTB Exam Setter. Use specific passages, formulas, and concepts from the NCTB textbook for Class ${classLevel}.

Generate 10 hard-level MCQ questions strictly following the Bangladesh National Curriculum (NCTB) textbook for Class ${classLevel}, Subject ${subject}, Chapter ${chapter}. Options must be tricky.

IMPORTANT: Provide bilingual content (Bangla and English) for each question, option, and explanation.

Return purely valid JSON as an object with a "questions" array. Each object must have:
- questionText: { bangla: string, english: string }
- options: array of 4 objects { bangla: string, english: string, isCorrect: boolean }
- correctAnswer: { bangla: string, english: string }
- explanation: { bangla: string, english: string }
- difficulty: number (exactly 0.8 to 0.95 for board standard)

Return ONLY the JSON.`;
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message.content;
        const data = JSON.parse(content);
        return data.questions || [];
    } catch (error) {
        console.error(`AI Generation Error for ${subject} ${chapter}:`, error.message);
        return [];
    }
}

async function seed() {
    console.log('🚀 Starting ParikshaPro NCTB Seeding (Refined)...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        let totalLoaded = 0;

        for (const topic of topics) {
            console.log(`📡 Fetching questions for [${topic.subject}] [${topic.chapter}]...`);

            // Overwrite logic: Clear existing questions for this specific topic and class
            const deleteResult = await Question.deleteMany({
                subject: { $regex: new RegExp(`^${topic.subject}$`, 'i') },
                class: topic.class,
                topic: topic.chapter
            });
            console.log(`🧹 Cleared ${deleteResult.deletedCount} existing questions for [${topic.chapter}]`);

            const generated = await generateQuestionsBatch(topic.class, topic.subject, topic.chapter);

            let chapterCount = 0;
            for (const qData of generated) {
                const isEnglish = topic.subject.toLowerCase() === 'english';

                await Question.create({
                    ...qData,
                    // Map English specific fields to bilingual schema if needed
                    questionText: isEnglish ? { english: qData.questionText } : qData.questionText,
                    options: isEnglish ? qData.options.map(opt => ({ english: opt.text, isCorrect: opt.isCorrect })) : qData.options,
                    correctAnswer: isEnglish ? { english: qData.correctAnswer } : qData.correctAnswer,
                    explanation: isEnglish ? { english: qData.explanation } : qData.explanation,

                    class: topic.class,
                    subject: topic.subject, // Store as provided in topic list (e.g., 'English')
                    topic: topic.chapter,
                    type: 'mcq',
                    source: 'generated'
                });
                chapterCount++;
                totalLoaded++;
            }
            console.log(`✅ Loaded [${topic.chapter}]: Added ${chapterCount} new questions.`);
        }

        console.log(`\n✨ Refined Seeding Complete! Total Questions Added: ${totalLoaded}`);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit();
    }
}

seed();
