const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Make sure this path points to your User model

dotenv.config();

const fakeNames = [
  "Aarav Patel", "Diya Sharma", "Rohan Gupta", "Ananya Singh", "Vihaan Malik",
  "Ishaan Kumar", "Saanvi Reddy", "Reyansh Joshi", "Myra Kapoor", "Arjun Verma",
  "Zara Khan", "Vivaan Mehta", "Ayaan Das", "Aditi Nair", "Kabir Shah",
  "Pari Choudhury", "Atharv Agarwal", "Anika Chatterjee", "Dhruv Saxena", "Meera Iyer"
];

const seedDatabase = async () => {
  try {
    // connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🌱 Seeding fake students...');

    const fakeUsers = fakeNames.map((name, index) => {
      // Create random scores between 100 and 5000
      const randomPoints = Math.floor(Math.random() * 5000) + 100;
      
      return {
        name: name,
        email: `student${index + 100}@example.com`,
        password: "$2b$12$daF3JsmxCP1ReOAbgvlJsuVp04ju0jO10NxMSPW/WRMlO3axfa6mO", // Dummy hashed password (password123)
        role: "student",
        studentClass: "10", // Put them all in Class 10 so they show up!
        gamification: {
          lifetimePoints: randomPoints,
          shikshaCoins: Math.floor(randomPoints / 10),
          stats: {
            totalTestsTaken: Math.floor(Math.random() * 20),
            dailyStreak: Math.floor(Math.random() * 5)
          }
        }
      };
    });

    // Insert them into the database
    await User.insertMany(fakeUsers);
    
    console.log(`🎉 Successfully added ${fakeUsers.length} fake students!`);
    console.log('🛑 Press Ctrl + C to exit.');
    process.exit();

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();