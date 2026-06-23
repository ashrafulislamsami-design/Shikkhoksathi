const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendOtpEmail } = require('../services/emailService');

const test = async () => {
  console.log('Sending test email to mdashrafulislamsami007@gmail.com...');
  try {
    const success = await sendOtpEmail('mdashrafulislamsami007@gmail.com', '123456');
    console.log('Email sent successfully:', success);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
};

test();
