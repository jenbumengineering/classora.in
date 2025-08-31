const nodemailer = require('nodemailer');

// Email configuration - Using secure SSL/TLS settings
const emailConfig = {
  host: 'server.dnspark.in',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: 'support@classora.in',
    pass: 'Unbreakable@7001'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
};

async function testEmailConnection() {
  try {
    console.log('Testing email connection...');
    console.log('Host:', emailConfig.host);
    console.log('Port:', emailConfig.port);
    console.log('Secure:', emailConfig.secure);
    console.log('User:', emailConfig.auth.user);
    
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email server connection verified successfully');
    
    // Send test email
    const testEmail = {
      from: '"Classora Test" <support@classora.in>',
      to: 'mainong.jenbum@gmail.com',
      subject: 'Email Configuration Test - Classora.in',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>This is a test email to verify that the email configuration is working correctly.</p>
            <p><strong>Server:</strong> ${emailConfig.host}</p>
            <p><strong>Port:</strong> ${emailConfig.port}</p>
            <p><strong>Secure:</strong> ${emailConfig.secure}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            If you receive this email, the email service is configured correctly.
          </p>
        </div>
      `,
      text: 'This is a test email to verify that the email configuration is working correctly.'
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', {
      code: error.code,
      response: error.response,
      command: error.command
    });
    return { success: false, error: error.message };
  }
}

// Run the test
testEmailConnection()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Email configuration is working correctly!');
      process.exit(0);
    } else {
      console.log('\n💥 Email configuration test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
