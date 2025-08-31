const nodemailer = require('nodemailer');

const emailConfig = {
  host: 'server.dnspark.in',
  port: 465,
  secure: true,
  auth: {
    user: 'support@classora.in',
    pass: 'Unbreakable@7001'
  },
  tls: {
    rejectUnauthorized: false
  }
};

async function sendQuickTest() {
  try {
    console.log('Sending quick test email...');
    
    const transporter = nodemailer.createTransport(emailConfig);
    
    const info = await transporter.sendMail({
      from: '"Classora" <support@classora.in>',
      to: 'mainong.jenbum@gmail.com',
      subject: 'Email Service Configured Successfully - Classora.in',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Service Successfully Configured!</h2>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p><strong>✅ Email service is now working correctly!</strong></p>
            <p>The Classora.in application can now send emails using the secure SSL/TLS configuration.</p>
            <ul>
              <li><strong>Server:</strong> server.dnspark.in</li>
              <li><strong>Port:</strong> 465 (SSL/TLS)</li>
              <li><strong>Account:</strong> support@classora.in</li>
              <li><strong>Status:</strong> Configured and tested</li>
            </ul>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            This email confirms that the email service configuration is complete and functional.
          </p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    return false;
  }
}

sendQuickTest().then(success => {
  if (success) {
    console.log('\n🎉 Email service configuration is complete!');
  } else {
    console.log('\n💥 Email service configuration failed!');
  }
  process.exit(success ? 0 : 1);
});
