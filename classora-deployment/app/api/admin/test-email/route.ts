import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { testEmailConnection, sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user-id')?.value
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, name: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { testType, recipientEmail } = body

    // Test email connection
    const connectionTest = await testEmailConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Email server connection failed',
        details: connectionTest.error
      }, { status: 500 })
    }

    // Send test email based on type
    let emailResult
    const testRecipient = recipientEmail || user.email

    switch (testType) {
      case 'connection':
        emailResult = { success: true, message: 'Email connection verified successfully' }
        break
        
      case 'contact':
        emailResult = await sendEmail(testRecipient, 'contactNotification', {
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Test Contact Form Submission',
          message: 'This is a test message from the admin panel to verify email functionality.'
        })
        break
        
      case 'assignment_submission':
        emailResult = await sendEmail(testRecipient, 'assignmentSubmission', {
          studentName: 'Test Student',
          assignmentTitle: 'Test Assignment',
          className: 'Test Class',
          professorEmail: testRecipient
        })
        break
        
      case 'assignment_graded':
        emailResult = await sendEmail(testRecipient, 'assignmentGraded', {
          studentName: 'Test Student',
          assignmentTitle: 'Test Assignment',
          grade: '85%',
          feedback: 'This is a test feedback message.',
          studentEmail: testRecipient
        })
        break
        
      case 'new_assignment':
        emailResult = await sendEmail(testRecipient, 'newAssignment', {
          studentName: 'Test Student',
          assignmentTitle: 'Test Assignment',
          className: 'Test Class',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          studentEmail: testRecipient
        })
        break
        
      case 'new_quiz':
        emailResult = await sendEmail(testRecipient, 'newQuiz', {
          studentName: 'Test Student',
          quizTitle: 'Test Quiz',
          className: 'Test Class',
          timeLimit: 30,
          studentEmail: testRecipient
        })
        break
        
      case 'new_note':
        emailResult = await sendEmail(testRecipient, 'newNote', {
          studentName: 'Test Student',
          noteTitle: 'Test Note',
          className: 'Test Class',
          studentEmail: testRecipient
        })
        break
        
      case 'welcome':
        emailResult = await sendEmail(testRecipient, 'welcomeEmail', {
          userName: 'Test User',
          userEmail: testRecipient,
          role: 'STUDENT'
        })
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type'
        }, { status: 400 })
    }

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testRecipient}`,
        messageId: emailResult.messageId,
        response: emailResult.response
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: emailResult.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { error: 'Internal server error during email test' },
      { status: 500 }
    )
  }
}
