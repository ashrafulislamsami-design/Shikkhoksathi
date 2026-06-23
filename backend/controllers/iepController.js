const Groq = require('groq-sdk');
const IEP = require('../models/IEP');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Generate IEP
exports.generateIEP = async (req, res) => {
  try {
    const {
      studentId,
      diagnosis,
      strengths,
      weaknesses
    } = req.body;

    // Validate
    if (!studentId || !diagnosis || !strengths || !weaknesses) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (studentId, diagnosis, strengths, weaknesses)'
      });
    }

    // Create AI prompt
    const prompt = `You are a special education expert in Bangladesh. Create a concise Individualized Education Plan (IEP) for:

**Student ID:** ${studentId}
**Diagnosis:** ${diagnosis}
**Strengths:** ${strengths}
**Weaknesses:** ${weaknesses}

Create an IEP with:

1. **SMART Goals** (3-5 specific, measurable goals)

2. **Compliance Statement:** Briefly state how this plan complies with the Bangladesh Rights of Persons with Disabilities Act 2013.

Format clearly with headers.`;

    // Call Groq AI
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const generatedPlan = chatCompletion.choices[0].message.content;

    // Parse AI response (simplified)
    const goals = extractListItems(generatedPlan, 'SMART Goals');

    // Save to database
    const iep = new IEP({
      studentId,
      diagnosis,
      strengths,
      weaknesses,
      smartGoals: goals,
      complianceFlag: true // Defaulted as per schema requirement
    });

    await iep.save();

    res.status(201).json({
      success: true,
      message: 'IEP generated successfully!',
      data: iep
    });

  } catch (error) {
    console.error('Error generating IEP:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: 'Error generating IEP',
      error: error.message
    });
  }
};

// Helper functions
function extractSection(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';

  const endIndex = endMarker ? text.indexOf(endMarker, startIndex + startMarker.length) : text.length;

  let sectionContent = '';
  if (endIndex === -1 || endIndex < startIndex) {
    sectionContent = text.substring(startIndex + startMarker.length).trim();
  } else {
    sectionContent = text.substring(startIndex + startMarker.length, endIndex).trim();
  }

  return sectionContent
    .replace(/^[:\s*-]+/, '')
    .replace(/\*\*+/g, '')
    .trim();
}

function extractListItems(text, sectionTitle) {
  const section = extractSection(text, sectionTitle, '##');
  if (!section) return [];

  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.match(/^[-*•]\s+|^\d+\.\s+/) || line.length > 10) // Match lists or reasonably long sentences
    .map(line => line.replace(/^[-*•]\s+|^\d+\.\s+/, '').replace(/\*\*+/g, '').trim())
    .filter(line => line.length > 0 && line !== 'SMART Goals') // Avoid section titles
    .slice(0, 10);
}

// Get all IEPs for a teacher
exports.getTeacherIEPs = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const ieps = await IEP.find({ teacherId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ieps.length,
      data: ieps
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching IEPs',
      error: error.message
    });
  }
};

// Get single IEP
exports.getIEP = async (req, res) => {
  try {
    const iep = await IEP.findById(req.params.id);

    if (!iep) {
      return res.status(404).json({
        success: false,
        message: 'IEP not found'
      });
    }

    res.status(200).json({
      success: true,
      data: iep
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching IEP',
      error: error.message
    });
  }
};

// Update IEP
exports.updateIEP = async (req, res) => {
  try {
    const iep = await IEP.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!iep) {
      return res.status(404).json({
        success: false,
        message: 'IEP not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'IEP updated successfully',
      data: iep
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating IEP',
      error: error.message
    });
  }
};

// Delete IEP
exports.deleteIEP = async (req, res) => {
  try {
    const iep = await IEP.findByIdAndDelete(req.params.id);

    if (!iep) {
      return res.status(404).json({
        success: false,
        message: 'IEP not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'IEP deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting IEP',
      error: error.message
    });
  }
};