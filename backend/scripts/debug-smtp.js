const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const nodemailer = require('nodemailer');

const email = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log('--- env values ---');
console.log('SMTP_USER:', JSON.stringify(email), 'Length:', email ? email.length : 0);
console.log('SMTP_PASS:', JSON.stringify(pass), 'Length:', pass ? pass.length : 0);

async function testGmail(username, password) {
  console.log(`\nTesting SMTP for ${username} with password length ${password ? password.length : 0}...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: username,
      pass: password
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Connection verified successfully!');
    return true;
  } catch (error) {
    console.error('❌ Connection verification failed:', error.message);
    return false;
  }
}

async function run() {
  if (!email || !pass) {
    console.error('❌ Error: SMTP_USER or SMTP_PASS is not defined in the environment variables.');
    return;
  }

  // Test 1: exact env password
  const t1 = await testGmail(email, pass);
  if (t1) return;

  // Test 2: env password with spaces dynamically formatted
  const passWithoutSpaces = pass.replace(/\s+/g, '');
  const passWithSpaces = passWithoutSpaces.replace(/(.{4})/g, '$1 ').trim();
  console.log(`Testing with dynamically formatted spaced password: ${passWithSpaces.slice(0, 4)}...`);
  const t2 = await testGmail(email, passWithSpaces);
  if (t2) {
    console.log('Success with spaces!');
    return;
  }
}

run();
