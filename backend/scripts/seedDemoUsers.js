const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const bcrypt = require('bcryptjs');

// Resolve IPv6/IPv4 lookup priority issue in Node.js for MongoDB SRV records
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Performance = require('../models/Performance');
const Career = require('../models/Career');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in your .env file!');
  process.exit(1);
}

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    // 1. SEED STUDENT USER
    const studentEmail = 'demo.student@shikkhoksathi.com';
    const studentPassword = 'StudentPass99';

    // Delete existing student if any
    await User.deleteMany({ email: studentEmail });
    console.log(`Deleted any existing student with email: ${studentEmail}`);

    // Create new student
    const student = new User({
      name: 'Demo Student',
      email: studentEmail,
      password: studentPassword, // Schema pre-save hook will hash this
      studentId: 'TUS88990',
      studentClass: '10',
      role: 'student',
      profile: {
        preferredLanguage: 'bangla',
        school: 'Dhaka Government School',
        board: 'Dhaka',
        interests: ['Mathematics', 'Science'],
        strengths: ['Analytical Thinking'],
        weaknesses: ['English Grammar']
      },
      gamification: {
        lifetimePoints: 2500,
        shikshaCoins: 250,
        streak: {
          current: 5,
          longest: 12,
          lastActive: new Date()
        },
        stats: {
          dailyStreak: 5,
          totalTestsTaken: 14,
          highestScore: 92
        }
      },
      coins: 250,
      xp: 1250
    });

    await student.save();
    console.log('✅ Created Demo Student.');

    // Initialize Performance tracking for Student
    await Performance.deleteMany({ userId: student._id });
    await Performance.create({
      userId: student._id,
      overallReadiness: 75,
      subjectReadiness: [
        { subject: 'Mathematics', score: 80 },
        { subject: 'General Science', score: 70 }
      ],
      topicMastery: [
        { subject: 'Mathematics', topic: 'Algebra', masteryLevel: 85 },
        { subject: 'General Science', topic: 'Physics', masteryLevel: 65 }
      ]
    });
    console.log('✅ Initialized Performance data for Demo Student.');

    // Initialize Career tracking for Student
    await Career.deleteMany({ userId: student._id });
    await Career.create({
      userId: student._id,
      skillGaps: [
        {
          skill: 'Advanced Coding',
          category: 'technical',
          currentLevel: 40,
          targetLevel: 80,
          priority: 'high',
          recommendations: ['Practice on LeetCode', 'Take Data Structures Course']
        },
        {
          skill: 'Public Speaking',
          category: 'soft_skill',
          currentLevel: 30,
          targetLevel: 70,
          priority: 'medium',
          recommendations: ['Join Toastmasters', 'Participate in presentations']
        }
      ],
      careerPathways: [
        {
          title: 'Software Engineer',
          description: 'Design and build software applications.',
          matchScore: 88,
          estimatedDuration: '4 years',
          potentialSalary: 'BDT 60,000 - 150,000/month',
          demandLevel: 'High',
          steps: [
            {
              phase: 'Foundation',
              title: 'Learn Basics',
              duration: '6 months',
              requirements: ['Programming fundamentals', 'Mathematics'],
              resources: ['Khan Academy', 'W3Schools']
            }
          ]
        }
      ]
    });
    console.log('✅ Initialized Career data for Demo Student.');


    // 2. SEED TEACHER USER
    const teacherEmail = 'demo.teacher@shikkhoksathi.com';
    const teacherPassword = 'TeacherPass99';

    // Delete existing teacher if any
    await Teacher.deleteMany({ email: teacherEmail });
    console.log(`Deleted any existing teacher with email: ${teacherEmail}`);

    // Hash password for teacher (no pre-save hook in Teacher model)
    const salt = await bcrypt.genSalt(10);
    const hashedTeacherPassword = await bcrypt.hash(teacherPassword, salt);

    const teacher = new Teacher({
      name: 'Demo Teacher',
      email: teacherEmail,
      password: hashedTeacherPassword,
      school: 'Dhaka Government School',
      district: 'Dhaka',
      upazila: 'Ramna',
      division: 'Dhaka',
      subjects: ['Mathematics', 'General Science'],
      classes: ['9', '10'],
      designation: 'Assistant Teacher',
      role: 'teacher'
    });

    await teacher.save();
    console.log('✅ Created Demo Teacher.');

    console.log('\n🎉 Seeding Completed Successfully! Both profiles are registered and ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
};

seed();
