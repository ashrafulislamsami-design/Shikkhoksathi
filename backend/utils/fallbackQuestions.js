// backend/utils/fallbackQuestions.js
const Question = require('../models/Question');

const FALLBACK_DATA = {
  'Math': [
    {
      questionText: { english: 'What is the value of x if 2x + 5 = 15?', bangla: 'যদি 2x + 5 = 15 হয়, তবে x এর মান কত?' },
      options: [
        { english: '5', bangla: '৫', isCorrect: true },
        { english: '10', bangla: '১০', isCorrect: false },
        { english: '3', bangla: '৩', isCorrect: false },
        { english: '7', bangla: '৭', isCorrect: false }
      ],
      explanation: { english: '2x = 10 => x = 5.', bangla: '2x = ১০ => x = ৫।' },
      difficulty: 0.4
    },
    {
      questionText: { english: 'Find the derivative of f(x) = x^2 + 3x.', bangla: 'f(x) = x^2 + 3x এর অন্তরক (derivative) কত?' },
      options: [
        { english: '2x + 3', bangla: '2x + ৩', isCorrect: true },
        { english: 'x + 3', bangla: 'x + ৩', isCorrect: false },
        { english: '2x', bangla: '2x', isCorrect: false },
        { english: '3x^2', bangla: '৩x^২', isCorrect: false }
      ],
      explanation: { english: 'd/dx (x^2 + 3x) = 2x + 3.', bangla: 'd/dx (x^২ + ৩x) = 2x + ৩।' },
      difficulty: 0.5
    },
    {
      questionText: { english: 'If log2(x) = 5, what is the value of x?', bangla: 'যদি log2(x) = ৫ হয়, তবে x এর মান কত?' },
      options: [
        { english: '32', bangla: '৩২', isCorrect: true },
        { english: '10', bangla: '১০', isCorrect: false },
        { english: '25', bangla: '২৫', isCorrect: false },
        { english: '64', bangla: '৬৪', isCorrect: false }
      ],
      explanation: { english: 'x = 2^5 = 32.', bangla: 'x = ২^৫ = ৩২।' },
      difficulty: 0.6
    },
    {
      questionText: { english: 'What is the sum of the interior angles of a triangle?', bangla: 'ত্রিভুজের অভ্যন্তরীণ কোণগুলোর সমষ্টি কত?' },
      options: [
        { english: '180 degrees', bangla: '১৮০ ডিগ্রি', isCorrect: true },
        { english: '360 degrees', bangla: '৩৬০ ডিগ্রি', isCorrect: false },
        { english: '90 degrees', bangla: '৯০ ডিগ্রি', isCorrect: false },
        { english: '270 degrees', bangla: '২৭০ ডিগ্রি', isCorrect: false }
      ],
      explanation: { english: 'The sum of internal angles of any triangle is always 180 degrees.', bangla: 'যেকোনো ত্রিভুজের অভ্যন্তরীণ কোণগুলোর সমষ্টি সর্বদা ১৮০ ডিগ্রি।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'Solve: 5x - 3 = 2x + 9.', bangla: 'সমাধান করো: 5x - ৩ = 2x + ৯।' },
      options: [
        { english: '4', bangla: '৪', isCorrect: true },
        { english: '3', bangla: '৩', isCorrect: false },
        { english: '2', bangla: '২', isCorrect: false },
        { english: '5', bangla: '৫', isCorrect: false }
      ],
      explanation: { english: '3x = 12 => x = 4.', bangla: '3x = ১২ => x = ৪।' },
      difficulty: 0.4
    }
  ],
  'Science': [
    {
      questionText: { english: 'What is the chemical formula for water?', bangla: 'পানির রাসায়নিক সংকেত কী?' },
      options: [
        { english: 'H2O', bangla: 'H2O', isCorrect: true },
        { english: 'CO2', bangla: 'CO2', isCorrect: false },
        { english: 'O2', bangla: 'O2', isCorrect: false },
        { english: 'NaCl', bangla: 'NaCl', isCorrect: false }
      ],
      explanation: { english: 'Water consists of two hydrogen atoms and one oxygen atom (H2O).', bangla: 'পানি দুটি হাইড্রোজেন পরমাণু এবং একটি অক্সিজেন পরমাণু নিয়ে গঠিত (H2O)।' },
      difficulty: 0.2
    },
    {
      questionText: { english: 'Which gas do plants absorb during photosynthesis?', bangla: 'সালোকসংশ্লেষণের সময় উদ্ভিদ কোন গ্যাস গ্রহণ করে?' },
      options: [
        { english: 'Carbon Dioxide', bangla: 'কার্বন ডাই অক্সাইড', isCorrect: true },
        { english: 'Oxygen', bangla: 'অক্সিজেন', isCorrect: false },
        { english: 'Nitrogen', bangla: 'নাইট্রোজেন', isCorrect: false },
        { english: 'Hydrogen', bangla: 'হাইড্রোজেন', isCorrect: false }
      ],
      explanation: { english: 'Plants absorb carbon dioxide (CO2) and release oxygen (O2) during photosynthesis.', bangla: 'সালোকসংশ্লেষণের সময় উদ্ভিদ কার্বন ডাই অক্সাইড (CO2) শোষণ করে এবং অক্সিজেন (O2) ত্যাগ করে।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'What is the powerhouse of the cell?', bangla: 'কোষের শক্তিঘর বা পাওয়ারহাউজ বলা হয় কাকে?' },
      options: [
        { english: 'Mitochondria', bangla: 'মাইটোকন্ড্রিয়া', isCorrect: true },
        { english: 'Nucleus', bangla: 'নিউক্লিয়াস', isCorrect: false },
        { english: 'Ribosome', bangla: 'রাইবোসোম', isCorrect: false },
        { english: 'Golgi Apparatus', bangla: 'গলগি বডি', isCorrect: false }
      ],
      explanation: { english: 'Mitochondria generate energy for the cell through respiration.', bangla: 'মাইটোকন্ড্রিয়া শ্বসনের মাধ্যমে কোষের শক্তি উৎপন্ন করে।' },
      difficulty: 0.4
    },
    {
      questionText: { english: 'Which of the following is a physical change?', bangla: 'নিচের কোনটি ভৌত পরিবর্তন?' },
      options: [
        { english: 'Melting of Ice', bangla: 'বরফ গলে যাওয়া', isCorrect: true },
        { english: 'Burning of Wood', bangla: 'কাঠ পোড়ানো', isCorrect: false },
        { english: 'Rusting of Iron', bangla: 'লোহায় মরিচা ধরা', isCorrect: false },
        { english: 'Souring of Milk', bangla: 'দুধ টক হয়ে যাওয়া', isCorrect: false }
      ],
      explanation: { english: 'Melting ice changes state but retains the same chemical structure.', bangla: 'বরফ গলে যাওয়া ভৌত পরিবর্তন কারণ এতে নতুন কোনো পদার্থের সৃষ্টি হয় না।' },
      difficulty: 0.4
    },
    {
      questionText: { english: 'What is the speed of light in a vacuum?', bangla: 'শূন্যস্থানে আলোর গতিবেগ কত?' },
      options: [
        { english: '3 * 10^8 m/s', bangla: '৩ * ১০^৮ মি./সে.', isCorrect: true },
        { english: '3 * 10^6 m/s', bangla: '৩ * ১০^৬ মি./সে.', isCorrect: false },
        { english: '1.5 * 10^8 m/s', bangla: '১.৫ * ১০^৮ মি./সে.', isCorrect: false },
        { english: '3 * 10^10 m/s', bangla: '৩ * ১০^১০ মি./সে.', isCorrect: false }
      ],
      explanation: { english: 'The speed of light is approximately 299,792 kilometers per second, or 3 * 10^8 m/s.', bangla: 'শূন্যস্থানে আলোর বেগ প্রতি সেকেন্ডে প্রায় ৩ লক্ষ কিলোমিটার বা ৩ * ১০^৮ মিটার।' },
      difficulty: 0.5
    }
  ],
  'English': [
    {
      questionText: { english: 'Identify the synonym of the word "Diligent".', bangla: '"Diligent" শব্দের সমার্থক শব্দ কোনটি?' },
      options: [
        { english: 'Hardworking', bangla: 'Hardworking', isCorrect: true },
        { english: 'Lazy', bangla: 'Lazy', isCorrect: false },
        { english: 'Careless', bangla: 'Careless', isCorrect: false },
        { english: 'Active', bangla: 'Active', isCorrect: false }
      ],
      explanation: { english: 'Diligent means showing care and conscientiousness in one\'s work.', bangla: 'Diligent শব্দের অর্থ পরিশ্রমী, যার সমার্থক শব্দ Hardworking।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'Choose the correct sentence:', bangla: 'সঠিক বাক্যটি নির্বাচন করো:' },
      options: [
        { english: 'He has been living here since five years.', bangla: 'He has been living here since five years.', isCorrect: false },
        { english: 'He has been living here for five years.', bangla: 'He has been living here for five years.', isCorrect: true },
        { english: 'He is living here since five years.', bangla: 'He is living here since five years.', isCorrect: false },
        { english: 'He lives here since five years.', bangla: 'He lives here since five years.', isCorrect: false }
      ],
      explanation: { english: '"For" is used to show a duration of time (five years).', bangla: 'সময়ের পরিধি বোঝাতে "for" ব্যবহৃত হয়।' },
      difficulty: 0.4
    },
    {
      questionText: { english: 'What is the past participle of the verb "Fly"?', bangla: '"Fly" ক্রিয়াপদের Past Participle রূপ কোনটি?' },
      options: [
        { english: 'Flown', bangla: 'Flown', isCorrect: true },
        { english: 'Flew', bangla: 'Flew', isCorrect: false },
        { english: 'Flyed', bangla: 'Flyed', isCorrect: false },
        { english: 'Flying', bangla: 'Flying', isCorrect: false }
      ],
      explanation: { english: 'Fly (present) -> Flew (past) -> Flown (past participle).', bangla: 'Fly এর রূপগুলো হলো Fly -> Flew -> Flown।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'Which of the following is an abstract noun?', bangla: 'নিচের কোনটি Abstract Noun?' },
      options: [
        { english: 'Honesty', bangla: 'Honesty', isCorrect: true },
        { english: 'Honest', bangla: 'Honest', isCorrect: false },
        { english: 'Boy', bangla: 'Boy', isCorrect: false },
        { english: 'Gold', bangla: 'Gold', isCorrect: false }
      ],
      explanation: { english: 'Honesty is an abstract concept that cannot be physically touched.', bangla: 'Honesty একটি গুণবাচক নাম, তাই এটি Abstract Noun।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'What is the antonym of the word "Brilliant"?', bangla: '"Brilliant" শব্দের বিপরীতার্থক শব্দ কোনটি?' },
      options: [
        { english: 'Dull', bangla: 'Dull', isCorrect: true },
        { english: 'Smart', bangla: 'Smart', isCorrect: false },
        { english: 'Bright', bangla: 'Bright', isCorrect: false },
        { english: 'Active', bangla: 'Active', isCorrect: false }
      ],
      explanation: { english: 'Brilliant means highly intelligent or bright, dull is the opposite.', bangla: 'Brilliant এর অর্থ মেধাবী বা উজ্জ্বল, Dull এর অর্থ নিষ্প্রভ বা নির্বোধ।' },
      difficulty: 0.3
    }
  ],
  'Bangla': [
    {
      questionText: { english: 'Who is the author of "Gitanjali"?', bangla: '"গীতাঞ্জলি" কাব্যগ্রন্থের রচয়িতা কে?' },
      options: [
        { english: 'Rabindranath Tagore', bangla: 'রবীন্দ্রনাথ ঠাকুর', isCorrect: true },
        { english: 'Kazi Nazrul Islam', bangla: 'কাজী নজরুল ইসলাম', isCorrect: false },
        { english: 'Jasimuddin', bangla: 'জসীমউদ্দীন', isCorrect: false },
        { english: 'Jibanananda Das', bangla: 'জীবনানন্দ দাশ', isCorrect: false }
      ],
      explanation: { english: 'Rabindranath Tagore won the Nobel Prize in Literature in 1913 for Gitanjali.', bangla: 'গীতাঞ্জলি রবীন্দ্রনাথ ঠাকুরের অন্যতম শ্রেষ্ঠ কাব্যগ্রন্থ যার জন্য তিনি ১৯১৩ সালে নোবেল পুরস্কার লাভ করেন।' },
      difficulty: 0.2
    },
    {
      questionText: { english: 'What type of word is "নীল আকাশ" (Blue Sky) - "নীল" (Blue)?', bangla: '"নীল আকাশ" বাক্যাংশে "নীল" কোন পদ?' },
      options: [
        { english: 'Adjective', bangla: 'বিশেষণ', isCorrect: true },
        { english: 'Noun', bangla: 'বিশেষ্য', isCorrect: false },
        { english: 'Pronoun', bangla: 'সর্বনাম', isCorrect: false },
        { english: 'Verb', bangla: 'ক্রিয়া', isCorrect: false }
      ],
      explanation: { english: '"Blue" describes the noun "Sky", so it is an adjective.', bangla: '"নীল" শব্দটি আকাশ পদের গুণ বা অবস্থা বোঝাচ্ছে, তাই এটি বিশেষণ পদ।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'What is the synonym of the word "কপাল" (Forehead)?', bangla: '"কপাল" শব্দের সমার্থক শব্দ কোনটি?' },
      options: [
        { english: 'ভাল (Bhalo)', bangla: 'ভাল', isCorrect: false },
        { english: 'ললাট (Lalat)', bangla: 'ললাট', isCorrect: true },
        { english: 'কর (Kor)', bangla: 'কর', isCorrect: false },
        { english: 'নয়ন (Noyon)', bangla: 'নয়ন', isCorrect: false }
      ],
      explanation: { english: '"Lalat" is a formal synonym for forehead in Bengali.', bangla: 'কপাল শব্দের সমার্থক শব্দ ললাট বা ভাল।' },
      difficulty: 0.4
    },
    {
      questionText: { english: 'Identify the correct spelling:', bangla: 'শুদ্ধ বানানটি নির্দেশ করো:' },
      options: [
        { english: 'মুহূর্ত (Muhurto)', bangla: 'মুহূর্ত', isCorrect: true },
        { english: 'মুহুত্ব (Muhutto)', bangla: 'মুহুত্ব', isCorrect: false },
        { english: 'মুহুর্ত (Muhurto - short u)', bangla: 'মুহুর্ত', isCorrect: false },
        { english: 'মুহূর্ত্ত (Muhurto - double t)', bangla: 'মুহূর্ত্ত', isCorrect: false }
      ],
      explanation: { english: '"মুহূর্ত" is the correct standard Bengali spelling.', bangla: 'শুদ্ধ বানান হলো হ-এ দীর্ঘ-উ দিয়ে "মুহূর্ত"।' },
      difficulty: 0.5
    },
    {
      questionText: { english: 'Which of the following is a composite sentence (যৌগিক বাক্য)?', bangla: 'নিচের কোনটি যৌগিক বাক্য?' },
      options: [
        { english: 'He studied and passed.', bangla: 'তিনি পড়াশোনা করলেন এবং পাস করলেন।', isCorrect: true },
        { english: 'He passed because he studied.', bangla: 'তিনি পড়াশোনা করায় পাস করলেন।', isCorrect: false },
        { english: 'Though he studied, he failed.', bangla: 'যদিও তিনি পড়াশোনা করলেন, তবুও ফেল করলেন।', isCorrect: false },
        { english: 'Study to pass.', bangla: 'পাস করার জন্য পড়াশোনা করো।', isCorrect: false }
      ],
      explanation: { english: 'Compound sentences connect clauses with conjunctions like "and/এবং".', bangla: '"এবং" সংযোজক অব্যয় থাকার কারণে এটি একটি যৌগিক বাক্য।' },
      difficulty: 0.5
    }
  ],
  'ICT': [
    {
      questionText: { english: 'What is the full form of HTML?', bangla: 'HTML এর পূর্ণরূপ কী?' },
      options: [
        { english: 'Hypertext Markup Language', bangla: 'Hypertext Markup Language', isCorrect: true },
        { english: 'Hyperlink Text Mark Language', bangla: 'Hyperlink Text Mark Language', isCorrect: false },
        { english: 'High Transfer Machine Language', bangla: 'High Transfer Machine Language', isCorrect: false },
        { english: 'Hypertext Machine Language', bangla: 'Hypertext Machine Language', isCorrect: false }
      ],
      explanation: { english: 'HTML stands for Hypertext Markup Language, used to structure web pages.', bangla: 'HTML এর পূর্ণরূপ হলো Hypertext Markup Language যা ওয়েব পেজ তৈরিতে ব্যবহৃত হয়।' },
      difficulty: 0.2
    },
    {
      questionText: { english: 'Which of the following is an input device?', bangla: 'নিচের কোনটি ইনপুট ডিভাইস?' },
      options: [
        { english: 'Keyboard', bangla: 'কিবোর্ড', isCorrect: true },
        { english: 'Monitor', bangla: 'মনিটর', isCorrect: false },
        { english: 'Printer', bangla: 'প্রিন্টার', isCorrect: false },
        { english: 'Speaker', bangla: 'স্পিকার', isCorrect: false }
      ],
      explanation: { english: 'A keyboard is used to enter text data into a computer.', bangla: 'কিবোর্ড এর মাধ্যমে কম্পিউটারে তথ্য ইনপুট দেওয়া হয়।' },
      difficulty: 0.2
    },
    {
      questionText: { english: 'What is the brain of a computer?', bangla: 'কম্পিউটারের মস্তিষ্ক বলা হয় কাকে?' },
      options: [
        { english: 'CPU (Central Processing Unit)', bangla: 'CPU (সেন্ট্রাল প্রসেসিং ইউনিট)', isCorrect: true },
        { english: 'RAM', bangla: 'র‍্যাম', isCorrect: false },
        { english: 'Hard Disk', bangla: 'হার্ড ডিস্ক', isCorrect: false },
        { english: 'Motherboard', bangla: 'মাদারবোর্ড', isCorrect: false }
      ],
      explanation: { english: 'The CPU processes instructions and manages other components.', bangla: 'CPU বা সেন্ট্রাল প্রসেসিং ইউনিট কম্পিউটারের সকল কাজ প্রক্রিয়াকরণ করে।' },
      difficulty: 0.3
    },
    {
      questionText: { english: 'Which network topology uses a central hub/switch?', bangla: 'কোন নেটওয়ার্ক টপোলজিতে একটি কেন্দ্রীয় হাব/সুইচ ব্যবহৃত হয়?' },
      options: [
        { english: 'Star Topology', bangla: 'স্টার টপোলজি', isCorrect: true },
        { english: 'Bus Topology', bangla: 'বাস টপোলজি', isCorrect: false },
        { english: 'Ring Topology', bangla: 'রিং টপোলজি', isCorrect: false },
        { english: 'Mesh Topology', bangla: 'মেশ টপোলজি', isCorrect: false }
      ],
      explanation: { english: 'Star topology connects all devices to a central hub.', bangla: 'স্টার টপোলজিতে সমস্ত ডিভাইস একটি কেন্দ্রীয় হাবের সাথে সংযুক্ত থাকে।' },
      difficulty: 0.4
    },
    {
      questionText: { english: 'Which port is commonly used to connect a pendrive?', bangla: 'পেনড্রাইভ সংযোগের জন্য সাধারণত কোন পোর্ট ব্যবহৃত হয়?' },
      options: [
        { english: 'USB', bangla: 'ইউএসবি (USB)', isCorrect: true },
        { english: 'VGA', bangla: 'ভিজিএ (VGA)', isCorrect: false },
        { english: 'HDMI', bangla: 'এইচডিএমআই (HDMI)', isCorrect: false },
        { english: 'LAN', bangla: 'ল্যান (LAN)', isCorrect: false }
      ],
      explanation: { english: 'USB ports are the standard for connection of flash drives.', bangla: 'পেনড্রাইভ বা ফ্ল্যাশ ড্রাইভ ইউএসবি পোর্টের সাহায্যে সংযুক্ত করা হয়।' },
      difficulty: 0.3
    }
  ]
};

/**
 * Gets or seeds fallback questions for the given subject.
 * @param {string} subject 
 * @param {string} classLevel 
 * @param {number} count 
 * @returns {Promise<Array>} Array of Question documents
 */
async function getFallbackQuestions(subject, classLevel, count = 10) {
  console.log(`[SEED] Attempting to generate fallback questions for Subject=${subject}, Class=${classLevel}...`);
  
  // Find subject-specific fallback questions
  const questionsToSeed = FALLBACK_DATA[subject] || FALLBACK_DATA['Math'];
  const seededList = [];
  
  for (const qData of questionsToSeed) {
    try {
      // Check if this exact question text already exists to prevent duplicate seeding
      const existing = await Question.findOne({
        'questionText.english': qData.questionText.english,
        subject: subject,
        class: classLevel
      });
      
      if (existing) {
        seededList.push(existing);
      } else {
        const newQ = await Question.create({
          ...qData,
          subject: subject,
          class: classLevel,
          topic: 'General',
          discrimination: 1.0,
          guessing: 0.25,
          source: 'remedial_fallback'
        });
        seededList.push(newQ);
      }
    } catch (err) {
      console.error('Error seeding fallback question:', err.message);
    }
  }
  
  // If we need more than we have, pad it by repeating or slicing
  const result = [];
  for (let i = 0; i < count; i++) {
    if (seededList.length > 0) {
      result.push(seededList[i % seededList.length]);
    }
  }
  
  return result;
}

module.exports = {
  getFallbackQuestions
};
