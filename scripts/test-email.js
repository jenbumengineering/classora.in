const nodemailer = require('nodemailer');

// Test email configuration
const emailConfig = {
  host: '173.249.24.112', // Use IP directly to avoid IPv6 issues
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true,
  requireTLS: false,
  ignoreTLS: true
};

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    
    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✓ Connection verified successfully');
    
    // Send test email to external address
    console.log('Sending test email to external address...');
    const info = await transporter.sendMail({
      from: '"Classora" <noreply@classora.in>',
      to: 'mainong.jenbum@gmail.com',
      subject: 'Test Email from VPS Mail Server',
      text: 'This is a test email from the VPS mail server configuration.',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the <strong>VPS mail server</strong>.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>If you receive this email, the configuration is working!</p>
      `
    });
    
    console.log('✓ Email sent successfully to external address');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    console.log('\n✓ External email sending is now configured and working!');
    console.log('The application can now send emails to external users.');
    
  } catch (error) {
    console.error('✗ Email test failed:', error);
    console.error('Error details:', {
      code: error.code,
      response: error.response,
      command: error.command
    });
  }
}

// Run the test
testEmail();
