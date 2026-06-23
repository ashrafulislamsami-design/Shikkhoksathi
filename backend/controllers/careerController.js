const Career = require('../models/Career');
const Performance = require('../models/Performance');
const User = require('../models/User');
const scrapingService = require('../services/scrapingService');
const groqService = require('../services/groqService');

// @desc    Analyze student's skill gaps
// @route   POST /api/career/analyze-gaps
// @access  Private
exports.analyzeSkillGaps = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const performance = await Performance.findOne({ userId });
    let career = await Career.findOne({ userId });

    if (!career) {
      career = await Career.create({ userId });
    }

    // Analyze based on performance data
    const skillGaps = [];

    // STEM skills analysis
    const stemSubjects = ['Math', 'Science', 'Physics', 'Chemistry', 'Biology', 'Higher Math', 'ICT'];
    performance.subjectReadiness.forEach(sr => {
      if (stemSubjects.includes(sr.subject) && sr.readiness < 70) {
        skillGaps.push({
          skill: sr.subject,
          category: 'STEM',
          currentLevel: sr.readiness,
          targetLevel: 85,
          priority: sr.readiness < 50 ? 'high' : sr.readiness < 60 ? 'medium' : 'low',
          recommendations: [
            `Practice ${sr.subject} regularly`,
            `Focus on weak topics in ${sr.subject}`,
            `Take more mock tests`
          ]
        });
      }
    });

    // Soft skills analysis (based on profile)
    const softSkills = ['Communication', 'Critical Thinking', 'Problem Solving', 'Time Management'];
    softSkills.forEach(skill => {
      if (!user.profile.strengths?.includes(skill)) {
        skillGaps.push({
          skill,
          category: 'soft_skill',
          currentLevel: 40,
          targetLevel: 80,
          priority: 'medium',
          recommendations: [
            `Join extracurricular activities`,
            `Practice group discussions`,
            `Take online courses on ${skill}`
          ]
        });
      }
    });

    // Map to NSDA vocational skills if applicable
    const nsdaSkills = {
      'ICT': ['Web Development', 'Database Management', 'Programming'],
      'Technical': ['Electronics', 'Mechanical Skills', 'Electrical Systems']
    };

    Object.entries(nsdaSkills).forEach(([category, skills]) => {
      skills.forEach(skill => {
        skillGaps.push({
          skill,
          category: 'vocational',
          currentLevel: 30,
          targetLevel: 75,
          priority: 'low',
          recommendations: [
            `Enroll in NSDA training programs`,
            `Seek apprenticeship opportunities`,
            `Practice hands-on projects`
          ]
        });
      });
    });

    await Career.findByIdAndUpdate(
      career._id,
      { skillGaps },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        skillGaps: skillGaps,
        summary: {
          total: skillGaps.length,
          high: skillGaps.filter(s => s.priority === 'high').length,
          medium: skillGaps.filter(s => s.priority === 'medium').length,
          low: skillGaps.filter(s => s.priority === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get personalized career roadmaps
// @route   GET /api/career/roadmaps
// @access  Private
exports.getCareerRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const performance = await Performance.findOne({ userId });
    let career = await Career.findOne({ userId });

    if (!career) {
      career = await Career.create({ userId });
    }

    // New AI Roadmap logic:
    if (career.roadmap && career.roadmap.careerTitle) {
      return res.json({
        success: true,
        data: career.roadmap
      });
    }

    // Generate career pathways based on profile and performance
    const pathways = [];

    // Fallback if performance is missing
    if (!performance || !performance.subjectReadiness) {
      return res.json({
        success: true,
        data: {
          pathways: [
            {
              title: 'Discovering Your Path',
              description: 'Take some mock tests to see personalized recommendations.',
              steps: [
                { phase: 'Assessment', title: 'Take a Mock Test', duration: '1 day', requirements: ['Any subject'], resources: ['Practice Hub'] }
              ],
              matchScore: 0,
              estimatedDuration: 'N/A',
              potentialSalary: 'TBD',
              demandLevel: 'Medium'
            }
          ],
          skillGaps: []
        }
      });
    }

    // Science/Engineering pathway
    const scienceScore = (performance.subjectReadiness || [])
      .filter(s => ['Physics', 'Chemistry', 'Biology', 'Math', 'Higher Math'].includes(s.subject))
      .reduce((acc, s) => acc + s.readiness, 0) / 5 || 50;

    if (scienceScore > 60) {
      pathways.push({
        title: 'Engineering Career Path',
        description: 'Pursue engineering education and technical careers',
        steps: [
          {
            phase: 'HSC',
            title: 'Complete Higher Secondary',
            duration: '2 years',
            requirements: ['Strong Math and Science scores', 'Minimum GPA 4.5'],
            resources: ['HSC Science textbooks', 'Online tutorials', 'Mock tests']
          },
          {
            phase: 'University',
            title: 'Engineering Degree (BSc)',
            duration: '4 years',
            requirements: ['Pass university admission test', 'Good HSC results'],
            resources: ['BUET preparation', 'Private university options']
          },
          {
            phase: 'Career',
            title: 'Engineering Job',
            duration: 'Ongoing',
            requirements: ['Bachelor degree', 'Technical skills', 'Internship experience'],
            resources: ['Job portals', 'LinkedIn', 'Company career pages']
          }
        ],
        matchScore: Math.round(scienceScore),
        metrics: {
          matchScore: `${Math.round(scienceScore)}%`,
          salary: '৳40,000 - ৳80,000',
          demand: 'High',
          estimatedDuration: '4 Years (Undergrad)'
        },
        estimatedDuration: '4 Years (Undergrad)',
        potentialSalary: '৳40,000 - ৳80,000/month (entry level)',
        demandLevel: 'High'
      });
    }

    // IT/Software pathway
    const ictScore = performance.subjectReadiness.find(s => s.subject === 'ICT')?.readiness || 50;

    if (ictScore > 50 || user.profile.interests?.includes('Technology')) {
      pathways.push({
        title: 'Software Development Career',
        description: 'Become a software developer or IT professional',
        steps: [
          {
            phase: 'Foundation',
            title: 'Learn Programming Basics',
            duration: '3-6 months',
            requirements: ['Computer access', 'Internet connection'],
            resources: ['freeCodeCamp', 'Codecademy', 'YouTube tutorials']
          },
          {
            phase: 'Skill Building',
            title: 'Web Development Specialization',
            duration: '6-12 months',
            requirements: ['HTML, CSS, JavaScript', 'Framework knowledge'],
            resources: ['Udemy courses', 'Project-based learning', 'GitHub']
          },
          {
            phase: 'Career Entry',
            title: 'Junior Developer Position',
            duration: '1-2 years',
            requirements: ['Portfolio projects', 'Basic experience'],
            resources: ['BDJobs', 'LinkedIn', 'Remote job sites']
          }
        ],
        matchScore: Math.round(ictScore + 20),
        metrics: {
          matchScore: `${Math.round(ictScore + 20)}%`,
          salary: '৳25,000 - ৳50,000',
          demand: 'Very High',
          estimatedDuration: '4 Years (Undergrad)'
        },
        estimatedDuration: '4 Years (Undergrad)',
        potentialSalary: '৳25,000 - ৳50,000/month (entry level)',
        demandLevel: 'Very High'
      });
    }

    // Vocational pathway
    pathways.push({
      title: 'Vocational/Technical Career',
      description: 'Gain practical skills for immediate employment',
      steps: [
        {
          phase: 'SSC/HSC',
          title: 'Complete Secondary Education',
          duration: '2-5 years',
          requirements: ['Basic education completion'],
          resources: ['School resources', 'NSDA information']
        },
        {
          phase: 'Training',
          title: 'NSDA Vocational Training',
          duration: '6-12 months',
          requirements: ['SSC/HSC certificate', 'Age 15+'],
          resources: ['NSDA centers', 'Technical institutes', 'Apprenticeships']
        },
        {
          phase: 'Employment',
          title: 'Skilled Worker Position',
          duration: 'Immediate',
          requirements: ['Certificate', 'Practical skills'],
          resources: ['Local job markets', 'NSDA job board', 'Networking']
        }
      ],
      matchScore: 70,
      metrics: {
        matchScore: '70%',
        salary: '৳15,000 - ৳35,000',
        demand: 'High',
        estimatedDuration: '1-2 Years'
      },
      estimatedDuration: '1-2 Years',
      potentialSalary: '৳15,000 - ৳35,000/month',
      demandLevel: 'High'
    });

    // Generate local skill gaps if not present or need update
    let skillGaps = career.skillGaps || [];
    if (skillGaps.length === 0 && performance && performance.subjectReadiness) {
      skillGaps = performance.subjectReadiness.map(s => {
        const target = 85;
        const current = s.readiness;
        return {
          skill: s.subject,
          category: 'Academic',
          currentLevel: current,
          targetLevel: target,
          priority: current < 40 ? 'high' : current < 70 ? 'medium' : 'low',
          recommendations: [
            `Focus on ${s.subject} core concepts`,
            `Complete ${s.subject} practice modules`,
            `Review past ${s.subject} assessments`
          ]
        };
      });
    }

    await Career.findByIdAndUpdate(
      career._id,
      {
        careerPathways: pathways,
        skillGaps: skillGaps
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        pathways: pathways.sort((a, b) => b.matchScore - a.matchScore),
        skillGaps: skillGaps
      }
    });
  } catch (error) {
    console.error('Career roadmaps error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get job listings from scraping
// @route   GET /api/career/jobs
// @access  Private
exports.getJobListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category = 'all', location, limit = 10 } = req.query;

    const user = await User.findById(userId);
    const userLocation = location || user.profile.location?.district || 'Dhaka';

    // Scrape job listings
    const jobs = await scrapingService.scrapeJobs(category, userLocation, parseInt(limit));

    // Get user's career profile for recommendations
    const career = await Career.findOne({ userId });
    const performance = await Performance.findOne({ userId });

    // Score jobs based on relevance
    const scoredJobs = jobs.map(job => {
      let matchScore = 50; // Base score

      // Match based on skills
      if (career?.skillGaps) {
        const userSkills = career.skillGaps
          .filter(g => g.currentLevel > 60)
          .map(g => (g.skill || g.name || '').toLowerCase());

        const jobRequirements = job.requirements.join(' ').toLowerCase();
        userSkills.forEach(skill => {
          if (jobRequirements.includes(skill)) {
            matchScore += 10;
          }
        });
      }

      // Match based on location
      if (job.location.includes(userLocation)) {
        matchScore += 15;
      }

      // Match based on education level
      const classLevel = parseInt(user.profile.class) || 10;
      if (classLevel >= 12) matchScore += 10;

      return {
        ...job,
        matchScore: Math.min(matchScore, 100)
      };
    });

    res.json({
      success: true,
      data: {
        jobs: scoredJobs.sort((a, b) => b.matchScore - a.matchScore),
        location: userLocation,
        scrapedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Job listings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save job listing
// @route   POST /api/career/jobs/save
// @access  Private
exports.saveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobData } = req.body;

    let career = await Career.findOne({ userId });

    if (!career) {
      career = await Career.create({ userId });
    }

    // Push job to savedJobs array
    if (!career.jobMarket) {
      career.jobMarket = { savedJobs: [], recommendations: [] };
    }

    career.jobMarket.savedJobs.push({
      ...jobData,
      scrapedAt: new Date()
    });

    const updated = await Career.findByIdAndUpdate(
      career._id,
      { jobMarket: career.jobMarket },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Job saved successfully',
      data: updated.jobMarket.savedJobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get course recommendations
// @route   GET /api/career/courses
// @access  Private
exports.getCourseRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const career = await Career.findOne({ userId });
    const user = await User.findById(userId);

    if (!career) {
      return res.status(404).json({
        success: false,
        message: 'Career profile not found'
      });
    }

    // Get top skill gaps to address
    const topGaps = career.skillGaps
      .filter(g => g.priority === 'high' || g.priority === 'medium')
      .slice(0, 5);

    // Generate course recommendations
    const courses = [];

    topGaps.forEach(gap => {
      const skillCourses = {
        'Math': [
          { title: 'Khan Academy Math', provider: 'Khan Academy', url: 'https://khanacademy.org', duration: 'Self-paced', cost: 'Free', relevance: 95 },
          { title: 'Advanced Mathematics', provider: 'Coursera', url: 'https://coursera.org', duration: '4 weeks', cost: 'Free/$49', relevance: 90 }
        ],
        'Programming': [
          { title: 'Web Development Bootcamp', provider: 'Udemy', url: 'https://udemy.com', duration: '40 hours', cost: '৳2000', relevance: 95 },
          { title: 'Python for Everybody', provider: 'Coursera', url: 'https://coursera.org', duration: '8 weeks', cost: 'Free', relevance: 90 }
        ],
        'Communication': [
          { title: 'Effective Communication Skills', provider: '10 Minute School', url: 'https://10minuteschool.com', duration: '2 hours', cost: '৳500', relevance: 85 }
        ]
      };

      const matchingCourses = skillCourses[gap.skill] || [
        { title: `${gap.skill} Fundamentals`, provider: 'YouTube', url: 'https://youtube.com', duration: 'Various', cost: 'Free', relevance: 70 }
      ];

      courses.push(...matchingCourses);
    });

    // Add certifications
    const certifications = [
      { name: 'Microsoft Office Specialist', authority: 'Microsoft', value: 'Entry-level jobs' },
      { name: 'NSDA Skills Certificate', authority: 'NSDA Bangladesh', value: 'Vocational employment' },
      { name: 'Google IT Support', authority: 'Google/Coursera', value: 'IT career entry' }
    ];

    career.recommendations = {
      courses,
      certifications,
      extracurriculars: ['Debate club', 'Science fair', 'Coding competitions', 'Volunteer work']
    };

    await Career.findByIdAndUpdate(
      career._id,
      { recommendations: career.recommendations },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        courses: courses.slice(0, 10),
        certifications,
        extracurriculars: career.recommendations.extracurriculars
      }
    });
  } catch (error) {
    console.error('Course recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Generate personalized career roadmap
// @route   POST /api/career/roadmap
// @access  Private
exports.getCareerRoadmap = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch User's Data
    const MockTest = require('../models/MockTest');
    const tests = await MockTest.find({ userId, status: 'completed' }).sort({ createdAt: -1 });
    const user = await User.findById(userId);

    // 2. EMPTY STATE: Prevent Loading Forever
    if (!tests || tests.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          careerTitle: "Discovering Your Path...",
          metrics: {
            matchScore: "0%",
            salary: "৳15,000 - ৳80,000/mo",
            demand: "Medium",
          },
          analysis: "I need more data! Take your first Mock Test in your favorite subject to help me identify your strengths.",
          roadmap: [
            { step: 1, title: "Diagnostic Assessment", tag: "Assessment", duration: "1 day", requirements: ["Pick any subject"], resources: ["Practice Lab"] },
            { step: 2, title: "Strength Analysis", tag: "AI Logic", duration: "Instant", requirements: ["1+ Test Completed"], resources: ["ShikshaAI Engine"] },
            { step: 3, title: "Career Matching", tag: "Locked", duration: "--", requirements: ["Data synchronization"], resources: ["Career Portal"] }
          ]
        }
      });
    }

    // 3. ANALYZE PERFORMANCE ZONES
    const performance = {};
    tests.forEach(test => {
      if (!performance[test.subject]) performance[test.subject] = { total: 0, count: 0 };
      performance[test.subject].total += test.score.percentage;
      performance[test.subject].count += 1;
    });

    const averages = Object.entries(performance).map(([subject, data]) => ({
      subject,
      avg: data.total / data.count
    })).sort((a, b) => b.avg - a.avg);

    const strongZone = averages[0].subject;
    const weakZone = averages[averages.length - 1].subject;

    // 4. MAP SUBJECTS TO CAREERS (Engine)
    let careerTitle, salary, demand, roadmap, matchScore;
    matchScore = Math.floor(averages[0].avg);

    if (['Math', 'Higher Math', 'Physics'].includes(strongZone)) {
      careerTitle = "Software Engineering & Tech";
      salary = "৳45,000 - ৳1,20,000/mo";
      demand = "Very High";
      roadmap = [
        { step: 1, title: "NCTB Science Stream Mastery", tag: "SSC/HSC", duration: "2 Years", requirements: ["GPA 5.0 in Math", "Strong Physics"], resources: ["ShikshaAI Test Hub", "NCTB Prep"] },
        { step: 2, title: "BSc in Computer Science", tag: "Undergrad", duration: "4 Years", requirements: ["BUET/DU Admission", "Logic Skills"], resources: ["Algorithm Playlists", "Coding Clubs"] },
        { step: 3, title: "Professional Developer", tag: "Employment", duration: "Immediate", requirements: ["JS/Python Skills", "Web Portfolio"], resources: ["BDJobs", "LinkedIn", "Global Remote"] }
      ];
    } else if (['Biology', 'Science'].includes(strongZone)) {
      careerTitle = "Medical & Health Sciences";
      salary = "৳50,000 - ৳1,50,000/mo";
      demand = "High";
      roadmap = [
        { step: 1, title: "Medical Prep Stream", tag: "SSC/HSC", duration: "2 Years", requirements: ["Bio-Mastery", "A+ in Chemistry"], resources: ["Biology Heatmaps", "Mock Med Tests"] },
        { step: 2, title: "MBBS Degree", tag: "Undergrad", duration: "5 Years", requirements: ["Med Admission Pass", "Persistence"], resources: ["Hospital Internship", "Local Clinics"] },
        { step: 3, title: "Certified Physician", tag: "Employment", duration: "Ongoing", requirements: ["BMDC License", "Specialization"], resources: ["Residency Programs", "District Hospitals"] }
      ];
    } else if (['ICT'].includes(strongZone)) {
      careerTitle = "IT & Digital Operations";
      salary = "৳30,000 - ৳70,000/mo";
      demand = "High";
      roadmap = [
        { step: 1, title: "ICT Board Excellence", tag: "SSC/HSC", duration: "1 Year", requirements: ["ICT Curriculum Focus"], resources: ["10 Minute School", "ICT Lab"] },
        { step: 2, title: "NSDA Professional Training", tag: "Vocational", duration: "6-12 Mo", requirements: ["Practical Coding", "Database Basics"], resources: ["NSDA Job Board", "Technical Institutes"] },
        { step: 3, title: "System Administrator", tag: "Employment", duration: "Immediate", requirements: ["CCNA/Linux Certs"], resources: ["Tech Parks", "BPO Sector"] }
      ];
    } else {
      careerTitle = "Business & Data Analytics";
      salary = "৳35,000 - ৳90,000/mo";
      demand = "Medium";
      roadmap = [
        { step: 1, title: "Commerce/Science Stream", tag: "SSC/HSC", duration: "2 Years", requirements: ["Analytical Skills", "English Proficiency"], resources: ["Business Math Hub"] },
        { step: 2, title: "BBA / Data Science", tag: "Undergrad", duration: "4 Years", requirements: ["IBA Admission", "Stats Interest"], resources: ["Coursera", "Excel Mastery"] },
        { step: 3, title: "Business Analyst", tag: "Employment", duration: "Immediate", requirements: ["PowerBI Skills", "Presentation"], resources: ["Multinational Corps", "Startups"] }
      ];
    }

    const analysis = `Based on your Strong Zone (${strongZone}) and Weak Zone (${weakZone}), I recommend a path in ${careerTitle}. You have a high aptitude for ${strongZone}, and mastering ${weakZone} will further boost your match score.`;

    // 5. INTEGRATE SKILL GAPS (AI-Powered Analysis)
    let skillGaps = [];
    try {
      const aiSkills = await groqService.analyzeSkillGaps(performance, user.profile);
      skillGaps = aiSkills.map(s => ({
        ...s,
        skill: s.skill || s.name // Mapping for safety
      }));
    } catch (err) {
      console.error("AI Skill Analysis failed, using rule-based fallback:", err);
      subjects.forEach(subject => {
        const avg = performance[subject].total / performance[subject].count;
        if (avg < 75) {
          skillGaps.push({
            skill: subject,
            priority: avg < 50 ? 'HIGH' : avg < 65 ? 'MEDIUM' : 'LOW',
            category: 'Academic Mastery',
            currentLevel: Math.round(avg),
            targetLevel: 85,
            recommendations: [
              `Review fundamental concepts in ${subject}`,
              `Complete ${subject} practice modules`
            ]
          });
        }
      });
    }

    // Ensure we have at least some skills to show categories
    if (skillGaps.length < 3) {
      const existingNames = skillGaps.map(s => (s.skill || s.name || '').toLowerCase());
      if (!existingNames.includes('problem solving')) {
        skillGaps.push({
          skill: "Problem Solving",
          category: "Soft Skills",
          priority: "MEDIUM",
          currentLevel: 45,
          targetLevel: 80,
          recommendations: ["Join coding challenges", "Practice logic puzzles"]
        });
      }
      if (!existingNames.includes('communication')) {
        skillGaps.push({
          skill: "Communication",
          category: "Soft Skills",
          priority: "LOW",
          currentLevel: 65,
          targetLevel: 85,
          recommendations: ["Join a debate club", "Read English journals"]
        });
      }
    }

    // 6. PERSIST TO DATABASE (Fix for singular/plural mismatch)
    await Career.findOneAndUpdate(
      { userId },
      {
        roadmap: {
          careerTitle,
          metrics: {
            matchScore: `${matchScore}%`,
            salary,
            demand,
            matchScoreRaw: matchScore,
            estimatedDuration: "4 Years (Undergrad)"
          },
          analysis,
          roadmap,
          skillGaps
        },
        skillGaps
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        careerTitle,
        metrics: {
          matchScore: `${matchScore}%`,
          salary,
          demand,
          matchScoreRaw: matchScore,
          estimatedDuration: "4 Years (Undergrad)"
        },
        analysis,
        roadmap,
        skillGaps
      }
    });

  } catch (error) {
    console.error("Career API Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

