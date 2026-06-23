require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixStreakData() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    // Find all users that don't have streak data
    console.log('\n🔍 Finding users without streak data...');
    const result = await User.updateMany(
      { 'gamification.streak': { $exists: false } },
      {
        $set: {
          'gamification.streak': {
            current: 0,
            longest: 0,
            lastActive: null
          }
        }
      }
    );

    console.log(`✅ Migration complete!`);
    console.log(`   - Updated ${result.modifiedCount} users`);
    console.log(`   - Matched ${result.matchedCount} users`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

fixStreakData();
