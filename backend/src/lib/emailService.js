import SibApiV3Sdk from '@sendinblue/client';

// Initialize Brevo (Sendinblue) client
const getBrevoClient = () => {
  const client = SibApiV3Sdk.ApiClient.instance;
  const apiKey = client.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  return new SibApiV3Sdk.TransactionalEmailsApi();
};

// Send OTP email using Brevo
export const sendOTPEmail = async (email, otp, fullname) => {
  try {
    // 🔥 Validate environment variables
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY not configured in environment variables');
      throw new Error('Email service not configured. Please add BREVO_API_KEY environment variable in Render dashboard.');
    }

    console.log(`📧 Attempting to send OTP to ${email}...`);
    console.log(`🔑 Using Brevo API (key length: ${process.env.BREVO_API_KEY?.length})`);
    
    const apiInstance = getBrevoClient();
    
    const sendSmtpEmail = {
      sender: { 
        email: 'noreply@privex.com', // Can be any email
        name: 'Privex Chat' 
      },
      to: [{ email: email, name: fullname }],
      subject: 'Verify Your Email - Privex Chat',
      htmlContent: `
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
    
    // Send email with timeout protection
    const sendEmailWithTimeout = Promise.race([
      apiInstance.sendTransacEmail(sendSmtpEmail),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000)
      )
    ]);
    
    await sendEmailWithTimeout;
    console.log(`✅ OTP email sent successfully to ${email} via Brevo`);
    return true;
  } catch (error) {
    console.error('❌❌❌ EMAIL SENDING FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Recipient:', email);
    
    if (error.message.includes('timeout')) {
      throw new Error('Email service timeout. Please try again.');
    } else if (error.message.includes('Unauthorized')) {
      throw new Error('Invalid Brevo API key. Please check BREVO_API_KEY in Render dashboard.');
    } else {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
};

// Test Brevo email service
export const testEmailService = async () => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY not configured');
      return false;
    }
    
    console.log('📧 Testing Brevo email service...');
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    const apiInstance = new SibApiV3Sdk.AccountApi();
    
    await Promise.race([
      apiInstance.getAccount(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
    
    console.log('✅ Brevo email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Brevo service test failed:', error.message);
    console.error('❌ OTP emails WILL NOT WORK');
    console.error('❌ Please check BREVO_API_KEY in Render dashboard');
    return false;
  }
};
