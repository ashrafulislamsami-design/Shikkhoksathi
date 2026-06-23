const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

// ==============================
// 1. IMPORT ROUTES
// ==============================
// Make sure these files exist in your 'backend/routes' folder
const studentAuth = require('./routes/studentAuth');
const mockTestRoutes = require('./routes/mockTests');
const gamificationRoutes = require('./routes/gamificationRoutes'); // Ensure filename matches!
const careerRoutes = require('./routes/career');
const performanceRoutes = require('./routes/performance');
const tutoringRoutes = require('./routes/tutoringRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const metaRoutes = require('./routes/meta');
// Teacher routes (Lane 1)
const teacherRoutes = require('./routes/teacherRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const iepRoutes = require('./routes/iepRoutes');

const app = express();

// ==============================
// 2. MIDDLEWARE
// ==============================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==============================
// 3. DATABASE CONNECTION (With In-Memory Fallback)
// ==============================
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB (Remote)');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Attempting fallback to In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      console.log('🌱 In-Memory MongoDB started at:', memoryUri);
      await mongoose.connect(memoryUri);
      console.log('✅ Connected to In-Memory MongoDB');
      
      // Auto-seed the database
      try {
        console.log('🌱 Seeding default student data into In-Memory MongoDB...');
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          const fakeNames = [
            "Aarav Patel", "Diya Sharma", "Rohan Gupta", "Ananya Singh", "Vihaan Malik",
            "Ishaan Kumar", "Saanvi Reddy", "Reyansh Joshi", "Myra Kapoor", "Arjun Verma",
            "Zara Khan", "Vivaan Mehta", "Ayaan Das", "Aditi Nair", "Kabir Shah",
            "Pari Choudhury", "Atharv Agarwal", "Anika Chatterjee", "Dhruv Saxena", "Meera Iyer"
          ];
          const fakeUsers = fakeNames.map((name, index) => {
            const randomPoints = Math.floor(Math.random() * 5000) + 100;
            return {
              name: name,
              email: `student${index + 100}@example.com`,
              password: "$2b$12$daF3JsmxCP1ReOAbgvlJsuVp04ju0jO10NxMSPW/WRMlO3axfa6mO", // password is 'password123'
              role: "student",
              studentClass: "10",
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
          await User.insertMany(fakeUsers);
          console.log(`🎉 Successfully seeded ${fakeUsers.length} students!`);
        }
      } catch (seedErr) {
        console.error('⚠️ Seeding failed:', seedErr);
      }
    } catch (fallbackErr) {
      console.error('❌ Fallback to In-Memory MongoDB also failed:', fallbackErr);
      process.exit(1);
    }
  }
};
connectDB();

// ==============================
// 4. REGISTER API ROUTES
// ==============================

// Lane 1: Teacher
app.use('/api/teachers', teacherRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/iep', iepRoutes);

// Lane 2: Student
app.use('/api/student', studentAuth);
app.use('/api/tests', mockTestRoutes);
app.use('/api/gamification', gamificationRoutes); // This mounts the route at /api/gamification
app.use('/api/game', gamificationRoutes); // Alias for /api/gamification for frontend compatibility
app.use('/api/performance', performanceRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/tutoring', tutoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/meta', metaRoutes);

// Root Test Route
app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});