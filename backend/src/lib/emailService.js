import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail App Password
    },
    pool: true, // Use connection pooling
    maxConnections: 1,
    rateDelta: 1000,
    rateLimit: 3
  });
};

// Send OTP email with timeout protection
export const sendOTPEmail = async (email, otp, fullname) => {
  try {
    // 🔥 Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ EMAIL_USER or EMAIL_PASS not configured in environment variables');
      console.error('❌ EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
      console.error('❌ EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
      throw new Error('Email service not configured. Please add EMAIL_USER and EMAIL_PASS environment variables in Render dashboard.');
    }

    console.log(`📧 Attempting to send OTP to ${email}...`);
    console.log(`🔑 Using EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`🔑 EMAIL_PASS length: ${process.env.EMAIL_PASS?.length}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Privex Chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Privex Chat',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${fullname}!</h2>
              <p>Welcome to <strong>Privex Chat</strong>! We're excited to have you join our community.</p>
              <p>To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your One-Time Password</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
              </div>
              
              <p><strong>Security Notice:</strong></p>
              <ul style="color: #666; line-height: 1.8;">
                <li>Never share this OTP with anyone</li>
                <li>Privex will never ask for your OTP via phone or email</li>
                <li>This code expires in 10 minutes</li>
              </ul>
              
              <p>If you didn't request this verification, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Privex Chat. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Send email with 15 second timeout
    const sendEmailWithTimeout = Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000)
      )
    ]);
    
    await sendEmailWithTimeout;
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌❌❌ EMAIL SENDING FAILED ❌❌❌');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Recipient:', email);
    console.error('EMAIL_USER:', process.env.EMAIL_USER);
    console.error('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
    
    // More specific error message
    if (error.message.includes('timeout')) {
      throw new Error('Gmail is not responding. Please check your email credentials in Render dashboard.');
    } else if (error.message.includes('Invalid login')) {
      throw new Error('Invalid Gmail credentials. Please verify EMAIL_USER and EMAIL_PASS in Render dashboard.');
    } else {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
};

// Test email configuration
export const testEmailService = async () => {
  try {
    console.log('📧 Testing email service...');
    const transporter = createTransporter();
    
    // Test with timeout
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email service verification timeout')), 10000)
      )
    ]);
    
    console.log('✅ Email service is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.error('❌ This means OTP emails WILL NOT WORK');
    console.error('❌ Please check EMAIL_USER and EMAIL_PASS in Render dashboard');
    return false;
  }
};
