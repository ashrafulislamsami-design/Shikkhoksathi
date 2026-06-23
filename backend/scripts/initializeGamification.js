require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function initializeGamificationData() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    // Initialize gamification fields for all users
    console.log('\n🔍 Initializing gamification data for all users...');
    
    const result = await User.updateMany(
      {},
      {
        $setOnInsert: {
          'gamification.lifetimePoints': 0,
          'gamification.shikshaCoins': 0,
          'gamification.streak': {
            current: 0,
            longest: 0,
            lastActive: null
          }
        }
      }
    );

    // Now set defaults for missing fields
    await User.updateMany(
      { 'gamification.lifetimePoints': { $exists: false } },
      {
        $set: {
          'gamification.lifetimePoints': 0,
          'gamification.shikshaCoins': 0
        }
      }
    );

    await User.updateMany(
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

    // Also initialize coins and xp at root level if missing
    await User.updateMany(
      { coins: { $exists: false } },
      {
        $set: {
          coins: 0
        }
      }
    );

    await User.updateMany(
      { xp: { $exists: false } },
      {
        $set: {
          xp: 0
        }
      }
    );

    await User.updateMany(
      { badges: { $exists: false } },
      {
        $set: {
          badges: []
        }
      }
    );

    // Give some initial XP to users who have none
    const usersWithoutXP = await User.countDocuments({ 'gamification.lifetimePoints': 0 });
    console.log(`\n📊 Found ${usersWithoutXP} users without XP`);
    
    // Award 100 XP to each user for testing/initial setup
    await User.updateMany(
      { 'gamification.lifetimePoints': 0 },
      {
        $set: {
          'gamification.lifetimePoints': 100,
          'gamification.shikshaCoins': 50
        }
      }
    );

    console.log('✅ Gamification initialization complete!');
    console.log(`   - All users now have XP and coins`);
    
    // Show sample users
    const sampleUsers = await User.find().select('name gamification.lifetimePoints gamification.shikshaCoins studentClass badges').limit(5);
    console.log('\n📋 Sample users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.name}: ${user.gamification?.lifetimePoints || 0} XP, ${user.gamification?.shikshaCoins || 0} coins, Class: ${user.studentClass || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

initializeGamificationData();
