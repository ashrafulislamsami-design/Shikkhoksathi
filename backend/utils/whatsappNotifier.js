// backend/utils/whatsappNotifier.js
// Sends WhatsApp alerts to admin when critical services fail (e.g., Groq API)
// Uses CallMeBot free WhatsApp API — no account needed.
//
// SETUP (one-time):
//   1. Save +34 644 71 81 48 as a contact on the admin's phone.
//   2. Send "I allow callmebot to send me messages" to that number via WhatsApp.
//   3. You'll receive an API key. Set it in .env as CALLMEBOT_API_KEY.

const https = require('https');
const http = require('http');

const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || '8801705570610'; // Bangladesh country code
const API_KEY = process.env.CALLMEBOT_API_KEY;

// Rate-limit: don't spam the admin. Max 1 alert per 10 minutes per error type.
const recentAlerts = new Map();
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Send a WhatsApp message to the admin.
 * @param {string} message - The alert message text
 * @param {string} errorType - A key to rate-limit duplicate alerts (e.g., 'groq_api_fail')
 */
async function sendWhatsAppAlert(message, errorType = 'general') {
  // Rate-limit check
  const lastSent = recentAlerts.get(errorType);
  if (lastSent && (Date.now() - lastSent) < COOLDOWN_MS) {
    console.log(`[WhatsApp] Skipping alert (cooldown active for '${errorType}'). Last sent ${Math.round((Date.now() - lastSent) / 1000)}s ago.`);
    return;
  }

  if (!API_KEY) {
    console.warn('[WhatsApp] CALLMEBOT_API_KEY not set. Falling back to email notification.');
    await sendEmailFallback(message);
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodedMessage}&apikey=${API_KEY}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[WhatsApp] ✅ Alert sent to admin: "${message.substring(0, 50)}..."`);
          recentAlerts.set(errorType, Date.now());
        } else {
          console.error(`[WhatsApp] ❌ Failed (HTTP ${res.statusCode}): ${data}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.error(`[WhatsApp] ❌ Network error:`, err.message);
      resolve(); // Don't crash the app
    });
  });
}

/**
 * Fallback: send email notification if WhatsApp is not configured
 */
async function sendEmailFallback(message) {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self (admin)
      subject: '🚨 ShikkhokSathi Alert: API Service Failure',
      text: message,
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; background: #fcfaf5; border: 2px solid #1a3300; border-radius: 12px;">
          <h2 style="color: #cb5521; margin: 0 0 12px 0;">🚨 ShikkhokSathi Service Alert</h2>
          <p style="color: #1a3300; line-height: 1.6;">${message}</p>
          <hr style="border: 1px solid rgba(26,51,0,0.15); margin: 16px 0;" />
          <p style="color: rgba(26,51,0,0.55); font-size: 12px;">This is an automated alert from your ShikkhokSathi backend.</p>
        </div>
      `
    });

    console.log('[Email] ✅ Alert email sent to admin.');
    recentAlerts.set('email_fallback', Date.now());
  } catch (err) {
    console.error('[Email] ❌ Failed to send alert email:', err.message);
  }
}

module.exports = { sendWhatsAppAlert };
