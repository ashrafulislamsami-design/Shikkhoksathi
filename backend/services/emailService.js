const nodemailer = require('nodemailer');

/**
 * Send an OTP email using SMTP or log to console if credentials are missing
 * @param {string} toEmail 
 * @param {string} otp 
 */
const sendOtpEmail = async (toEmail, otp) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.brevo.com';
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@shikkhoksathi.com';

  if (!smtpUser || !smtpPass) {
    // Highly visible local development logging fallback
    console.log('\n' + '='.repeat(60));
    console.log(`🔑 [DEMO MODE] EMAIL VERIFICATION CODE`);
    console.log(`To Email:     ${toEmail}`);
    console.log(`Code (OTP):   ${otp}`);
    console.log(`Expires In:   5 minutes`);
    console.log('='.repeat(60) + '\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"ShikkhokSathi AI" <${smtpFrom}>`,
      to: toEmail,
      subject: `ShikkhokSathi AI - Email Verification Code`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 2px solid #1a3300; border-radius: 12px; background-color: #fcfaf5; color: #1a3300;">
          <h2 style="font-family: 'Outfit', sans-serif; text-align: center; color: #1a3300; margin-bottom: 20px; border-bottom: 2px dashed rgba(26,51,0,0.15); padding-pb: 10px;">Verify Your Email</h2>
          <p style="font-size: 15px; line-height: 1.5; color: rgba(26,51,0,0.75);">Welcome to ShikkhokSathi AI! Use the verification code below to verify your email address and activate your account:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; padding: 10px 24px; background-color: #ffe95c; border: 2px solid #1a3300; border-radius: 8px; box-shadow: 3px 3px 0px #1a3300; display: inline-block; color: #1a3300;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: rgba(26,51,0,0.5); text-align: center; margin-top: 25px;">This verification code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
          <div style="border-top: 2px dashed rgba(26,51,0,0.15); margin-top: 25px; padding-top: 15px; text-align: center; font-size: 11px; color: rgba(26,51,0,0.4);">
            Built with Precision • Bangladesh EdTech Initiative
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email successfully dispatched to ${toEmail}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to dispatch SMTP email to ${toEmail}:`, error.message);
    
    let userFriendlyMsg = 'Verification email dispatch failed. Please check your SMTP settings.';
    if (error.message.includes('535') || error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
      userFriendlyMsg = 'SMTP Authentication failed: Gmail rejected your credentials. Please ensure your Gmail App Password is correct and entered without spaces in backend/.env.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      userFriendlyMsg = 'SMTP Connection failed: Could not connect to the mail server. Please check SMTP_HOST, SMTP_PORT, and your internet connection.';
    } else {
      userFriendlyMsg = `SMTP Dispatch Error: ${error.message}`;
    }
    
    throw new Error(userFriendlyMsg);
  }
};

module.exports = { sendOtpEmail };
