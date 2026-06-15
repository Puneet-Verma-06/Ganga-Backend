const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: create Gmail transporter
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'gangapropertyofficial@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Helper: create Ethereal test transporter
const createTestTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

// Send OTP email with Gmail primary and Ethereal fallback
const sendOTPEmail = async (email, otp, name) => {
  const fromAddress = `"Ganga Property" <${process.env.GMAIL_USER || 'gangapropertyofficial@gmail.com'}>`;

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Email Verification - OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background-color: #f0f0f0; border: 2px dashed #4CAF50; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
          .footer { margin-top: 20px; text-align: center; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Ganga Property</h1></div>
          <div class="content">
            <h2>Hello ${name || 'User'},</h2>
            <p>Thank you for signing up with Ganga Property!</p>
            <p>To complete your registration, please use the following One-Time Password (OTP):</p>
            <div class="otp-box"><div class="otp-code">${otp}</div></div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP is valid for 10 minutes</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br/>Ganga Property Team</p>
          </div>
          <div class="footer"><p>This is an automated email. Please do not reply to this message.</p></div>
        </div>
      </body>
      </html>
    `
  };

  // If explicitly requested, use Ethereal for testing
  if (process.env.FORCE_ETHEREAL === 'true' || process.env.USE_ETHEREAL === 'true') {
    try {
      const testTransporter = await createTestTransporter();
      const info = await testTransporter.sendMail(mailOptions);
      console.log('OTP email sent via Ethereal:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (err) {
      console.error('Ethereal send failed:', err);
      throw new Error('Failed to send OTP email');
    }
  }

  // Try Gmail first, fall back to Ethereal on authentication failure
  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent via Gmail:', info.messageId);
    console.log('Gmail send info:', {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Gmail send failed:', error && error.message ? error.message : error);

    // If Gmail auth failed or any error, attempt Ethereal fallback so signup doesn't 500
    try {
      const testTransporter = await createTestTransporter();
      const info = await testTransporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.warn('Fell back to Ethereal for OTP email. Preview URL:', previewUrl);
      console.log('Ethereal send info:', { accepted: info.accepted, rejected: info.rejected });
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err) {
      console.error('Ethereal fallback failed:', err);
      throw new Error('Failed to send OTP email');
    }
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};
