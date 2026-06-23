const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const Question = require('../models/Question');

const MONGODB_URI = process.env.MONGODB_URI;

async function purgeEnglish() {
    console.log('🧹 Starting English Question Purge...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const result = await Question.deleteMany({
            subject: { $regex: new RegExp('^english$', 'i') }
        });

        console.log(`✅ Purged ${result.deletedCount} English questions from database.`);
    } catch (error) {
        console.error('❌ Purge Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit();
    }
}

purgeEnglish();
