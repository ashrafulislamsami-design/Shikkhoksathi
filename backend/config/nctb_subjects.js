/**
 * NCTB (National Curriculum and Textbook Board) Subject Mapping
 * Single Source of Truth for Bangladesh Education System
 * Classes 1-12 with Stream-Specific Subjects
 */

const NCTB_SUBJECTS = {
    // Primary Level (Classes 1-5)
    1: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion'],
    2: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion'],
    3: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion'],
    4: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion'],
    5: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion'],

    // Junior Secondary (Classes 6-8)
    6: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion', 'ICT', 'Agriculture', 'Home Science', 'Arts & Crafts'],
    7: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion', 'ICT', 'Agriculture', 'Home Science', 'Arts & Crafts'],
    8: ['Bangla', 'English', 'Mathematics', 'Science', 'Bangladesh & Global Studies', 'Religion', 'ICT', 'Agriculture', 'Home Science', 'Arts & Crafts'],

    // Secondary Level (Classes 9-10) - Stream-Based
    9: {
        common: ['Bangla', 'English', 'Mathematics', 'Religion', 'ICT'],
        science: ['Physics', 'Chemistry', 'Biology', 'Higher Math'],
        commerce: ['Accounting', 'Finance', 'Business Entrepreneurship'],
        arts: ['History', 'Geography', 'Civics', 'Economics']
    },
    10: {
        common: ['Bangla', 'English', 'Mathematics', 'Religion', 'ICT'],
        science: ['Physics', 'Chemistry', 'Biology', 'Higher Math'],
        commerce: ['Accounting', 'Finance', 'Business Entrepreneurship'],
        arts: ['History', 'Geography', 'Civics', 'Economics']
    },

    // Higher Secondary (Classes 11-12) - Stream-Based
    11: {
        common: ['Bangla', 'English', 'ICT'],
        science: ['Physics', 'Chemistry', 'Biology', 'Higher Math', 'Statistics'],
        commerce: ['Accounting', 'Finance', 'Business Organization', 'Economics', 'Statistics'],
        arts: ['History', 'Geography', 'Civics', 'Economics', 'Islamic Studies', 'Logic', 'Sociology']
    },
    12: {
        common: ['Bangla', 'English', 'ICT'],
        science: ['Physics', 'Chemistry', 'Biology', 'Higher Math', 'Statistics'],
        commerce: ['Accounting', 'Finance', 'Business Organization', 'Economics', 'Statistics'],
        arts: ['History', 'Geography', 'Civics', 'Economics', 'Islamic Studies', 'Logic', 'Sociology']
    }
};

/**
 * Get subjects for a specific class and stream
 * @param {number} classLevel - Class level (1-12)
 * @param {string} stream - Stream (science/commerce/arts) - only for classes 9-12
 * @returns {Array} - Array of subject names
 */
const getSubjectsForClass = (classLevel, stream = null) => {
    const classData = NCTB_SUBJECTS[classLevel];

    if (!classData) {
        throw new Error(`Invalid class level: ${classLevel}`);
    }

    // For classes 1-8, return subjects directly
    if (Array.isArray(classData)) {
        return classData;
    }

    // For classes 9-12, combine common + stream-specific subjects
    if (typeof classData === 'object') {
        const commonSubjects = classData.common || [];
        const streamSubjects = stream && classData[stream.toLowerCase()] ? classData[stream.toLowerCase()] : [];
        return [...commonSubjects, ...streamSubjects];
    }

    return [];
};

/**
 * Get all available streams for a class level
 * @param {number} classLevel - Class level (1-12)
 * @returns {Array} - Array of stream names or empty array
 */
const getStreamsForClass = (classLevel) => {
    const classData = NCTB_SUBJECTS[classLevel];

    if (typeof classData === 'object' && !Array.isArray(classData)) {
        return Object.keys(classData).filter(key => key !== 'common');
    }

    return [];
};

/**
 * Check if a class requires stream selection
 * @param {number} classLevel - Class level (1-12)
 * @returns {boolean}
 */
const requiresStream = (classLevel) => {
    return classLevel >= 9 && classLevel <= 12;
};

module.exports = {
    NCTB_SUBJECTS,
    getSubjectsForClass,
    getStreamsForClass,
    requiresStream
};
