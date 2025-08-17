import nodemailer from 'nodemailer'

// Email configuration - Using the working configuration
const emailConfig = {
  host: 'mail.classora.in',
  port: 587,
  secure: false,
  auth: {
    user: 'support@classora.in',
    pass: 'Unbreakable@7001'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Enable debug to see what's happening
  logger: true,
  requireTLS: true,
  ignoreTLS: false
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

// Email templates
export const emailTemplates = {
  // Contact form notification
  contactNotification: (data: {
    name: string
    email: string
    subject: string
    message: string
  }) => ({
    subject: `New Contact Form Submission: ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${data.name} (${data.email})</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          This message was sent from the Classora.in contact form.
        </p>
      </div>
    `
  }),

  // Contact reply notification
  contactReply: (data: { 
    userName: string; 
    userEmail: string; 
    originalSubject: string; 
    originalMessage: string; 
    adminName: string; 
    replyMessage: string 
  }) => ({
    subject: `Re: ${data.originalSubject} - Classora.in Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Response from Classora.in Support</h2>
        <p>Dear ${data.userName},</p>
        <p>Thank you for contacting us. Here is our response to your inquiry:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Your Original Message:</strong></p>
          <p style="color: #6b7280; font-style: italic;">${data.originalMessage.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2563eb;">
          <p><strong>Our Response:</strong></p>
          <p>${data.replyMessage.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        <p>Best regards,<br><strong>${data.adminName}</strong><br>Classora.in Support Team</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated response to your contact form submission.
        </p>
      </div>
    `
  }),

  // Assignment submission notification to professor
  assignmentSubmission: (data: {
    studentName: string
    assignmentTitle: string
    className: string
    professorEmail: string
  }) => ({
    subject: `New Assignment Submission: ${data.assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Assignment Submission</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${data.studentName}</p>
          <p><strong>Assignment:</strong> ${data.assignmentTitle}</p>
          <p><strong>Class:</strong> ${data.className}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Please log in to your dashboard to review and grade this submission.
        </p>
      </div>
    `
  }),

  // Assignment graded notification to student
  assignmentGraded: (data: {
    studentName: string
    assignmentTitle: string
    grade: string
    feedback?: string
    studentEmail: string
  }) => ({
    subject: `Assignment Graded: ${data.assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Assignment Graded</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Assignment:</strong> ${data.assignmentTitle}</p>
          <p><strong>Grade:</strong> <span style="font-weight: bold; color: #059669;">${data.grade}</span></p>
          ${data.feedback ? `<p><strong>Feedback:</strong></p><div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">${data.feedback}</div>` : ''}
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Log in to your dashboard to view the complete feedback and grade details.
        </p>
      </div>
    `
  }),

  // New assignment notification to students
  newAssignment: (data: {
    studentName: string
    assignmentTitle: string
    className: string
    dueDate: string
    studentEmail: string
  }) => ({
    subject: `New Assignment: ${data.assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Assignment Available</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Assignment:</strong> ${data.assignmentTitle}</p>
          <p><strong>Class:</strong> ${data.className}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Log in to your dashboard to view the assignment details and submit your work.
        </p>
      </div>
    `
  }),

  // New quiz notification to students
  newQuiz: (data: {
    studentName: string
    quizTitle: string
    className: string
    timeLimit: number
    studentEmail: string
  }) => ({
    subject: `New Quiz: ${data.quizTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Quiz Available</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Quiz:</strong> ${data.quizTitle}</p>
          <p><strong>Class:</strong> ${data.className}</p>
          <p><strong>Time Limit:</strong> ${data.timeLimit} minutes</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Log in to your dashboard to take the quiz.
        </p>
      </div>
    `
  }),

  // New note notification to students
  newNote: (data: {
    studentName: string
    noteTitle: string
    className: string
    studentEmail: string
  }) => ({
    subject: `New Note: ${data.noteTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Note Available</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Note:</strong> ${data.noteTitle}</p>
          <p><strong>Class:</strong> ${data.className}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Log in to your dashboard to view the new note.
        </p>
      </div>
    `
  }),

  // Welcome email for new users
  welcomeEmail: (data: {
    userName: string
    userEmail: string
    role: string
  }) => ({
    subject: `Welcome to Classora.in, ${data.userName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Classora.in!</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello ${data.userName},</p>
          <p>Welcome to Classora.in! Your account has been successfully created as a <strong>${data.role}</strong>.</p>
          <p>You can now:</p>
          <ul>
            <li>Access your personalized dashboard</li>
            <li>Join or create classes</li>
            <li>Manage assignments and quizzes</li>
            <li>Track your progress</li>
          </ul>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          If you have any questions, please don't hesitate to contact our support team.
        </p>
      </div>
    `
  }),

  // Password reset email
  passwordReset: (data: {
    userName: string
    userEmail: string
    resetToken: string
    resetUrl: string
  }) => ({
    subject: 'Password Reset Request - Classora.in',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello ${data.userName},</p>
          <p>We received a request to reset your password for your Classora.in account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>This link will expire in 1 hour for security reasons.</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${data.resetUrl}
        </p>
      </div>
    `
  }),

  // Backup notification email
  backupNotification: (data: {
    backupName: string
    backupSize: string
    backupType: string
    createdAt: string
    createdBy: string
  }) => ({
    subject: `Database Backup Created - ${data.backupName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Database Backup Created</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Backup Name:</strong> ${data.backupName}</p>
          <p><strong>Backup Size:</strong> ${data.backupSize}</p>
          <p><strong>Backup Type:</strong> ${data.backupType}</p>
          <p><strong>Created At:</strong> ${data.createdAt}</p>
          <p><strong>Created By:</strong> ${data.createdBy}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          The database backup has been successfully created and is attached to this email.
        </p>
      </div>
    `
  }),

  // Class invitation email
  classInvitation: (data: {
    studentEmail: string
    className: string
    professorName: string
    invitationUrl: string
    expiresAt: string
  }) => ({
    subject: `You're invited to join ${data.className} - Classora.in`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Class Invitation</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello!</p>
          <p>You have been invited by <strong>${data.professorName}</strong> to join the class:</p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb; margin: 15px 0;">
            <h3 style="margin: 0; color: #2563eb;">${data.className}</h3>
          </div>
          <p>Click the button below to accept this invitation and join the class:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p><strong>Important:</strong> This invitation will expire on ${data.expiresAt}.</p>
          <p>If you don't have a Classora.in account yet, you'll be able to create one when you accept the invitation.</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${data.invitationUrl}
        </p>
      </div>
    `
  })
}

// Email sending function
export async function sendEmail(to: string, template: keyof typeof emailTemplates, data: any) {
  try {
    console.log('Attempting to send email to:', to)
    console.log('Email template:', template)
    
    const emailTemplate = emailTemplates[template](data)
    
    const mailOptions = {
      from: '"Classora" <support@classora.in>',
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'Reply-To': 'support@classora.in',
        'X-Mailer': 'Classora Email System',
        'List-Unsubscribe': '<mailto:support@classora.in?subject=unsubscribe>',
        'Precedence': 'bulk'
      }
    }

    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    console.log('Full response:', info)
    return { success: true, messageId: info.messageId, response: info }
  } catch (error) {
    console.error('Error sending email:', error)
    console.error('Error details:', {
      code: error instanceof Error ? (error as any).code : 'unknown',
      response: error instanceof Error ? (error as any).response : 'unknown',
      command: error instanceof Error ? (error as any).command : 'unknown'
    })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test email function
export async function testEmailConnection() {
  try {
    await transporter.verify()
    console.log('Email server connection verified successfully')
    return { success: true, message: 'Email server connection verified' }
  } catch (error) {
    console.error('Email server connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send contact form email to admin
export async function sendContactFormEmail(contactData: {
  name: string
  email: string
  subject: string
  message: string
}) {
  return await sendEmail('support@classora.in', 'contactNotification', contactData)
}

// Send assignment submission notification
export async function sendAssignmentSubmissionEmail(data: {
  studentName: string
  assignmentTitle: string
  className: string
  professorEmail: string
}) {
  return await sendEmail(data.professorEmail, 'assignmentSubmission', data)
}

// Send assignment graded notification
export async function sendAssignmentGradedEmail(data: {
  studentName: string
  assignmentTitle: string
  grade: string
  feedback?: string
  studentEmail: string
}) {
  return await sendEmail(data.studentEmail, 'assignmentGraded', data)
}

// Send backup notification with attachment
export async function sendBackupNotificationEmail(data: {
  backupName: string
  backupSize: string
  backupType: string
  createdAt: string
  createdBy: string
  backupFilePath: string
}) {
  try {
    console.log('Sending backup notification email with attachment')
    
    const emailTemplate = emailTemplates.backupNotification(data)
    
    // Read the backup file
    const fs = require('fs')
    const backupFile = fs.readFileSync(data.backupFilePath)
    
    const mailOptions = {
      from: '"Classora" <support@classora.in>',
      to: 'jenbumengineering@gmail.com, mainong.jenbum@gmail.com, jenbumacademy@gmail.com',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.html.replace(/<[^>]*>/g, ''),
      attachments: [
        {
          filename: data.backupName,
          content: backupFile,
          contentType: 'application/octet-stream'
        }
      ],
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'Reply-To': 'support@classora.in',
        'X-Mailer': 'Classora Email System'
      }
    }

    console.log('Backup email options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachment: data.backupName
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('Backup notification email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId, response: info }
  } catch (error) {
    console.error('Error sending backup notification email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send new assignment notification
export async function sendNewAssignmentEmail(data: {
  studentName: string
  assignmentTitle: string
  className: string
  dueDate: string
  studentEmail: string
}) {
  return await sendEmail(data.studentEmail, 'newAssignment', data)
}

// Send new quiz notification
export async function sendNewQuizEmail(data: {
  studentName: string
  quizTitle: string
  className: string
  timeLimit: number
  studentEmail: string
}) {
  return await sendEmail(data.studentEmail, 'newQuiz', data)
}

// Send new note notification
export async function sendNewNoteEmail(data: {
  studentName: string
  noteTitle: string
  className: string
  studentEmail: string
}) {
  return await sendEmail(data.studentEmail, 'newNote', data)
}

// Send welcome email
export async function sendWelcomeEmail(data: {
  userName: string
  userEmail: string
  role: string
}) {
  return await sendEmail(data.userEmail, 'welcomeEmail', data)
}

// Send password reset email
export async function sendPasswordResetEmail(data: {
  userName: string
  userEmail: string
  resetToken: string
  resetUrl: string
}) {
  return await sendEmail(data.userEmail, 'passwordReset', data)
}

// Send class invitation email
export async function sendClassInvitationEmail(data: {
  studentEmail: string
  className: string
  professorName: string
  invitationUrl: string
  expiresAt: string
}) {
  return await sendEmail(data.studentEmail, 'classInvitation', data)
}
