const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const nodemailer = require('nodemailer');

const email = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

async function testGmailService() {
  console.log('Testing with service: gmail option...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: pass
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Success with service: gmail!');
  } catch (error) {
    console.error('❌ Failed with service: gmail:', error.message);
  }
}

testGmailService();
