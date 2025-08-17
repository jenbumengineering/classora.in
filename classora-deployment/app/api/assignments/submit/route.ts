import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { sendAssignmentSubmissionEmail } from '@/lib/email'

// Validation schema for assignment submission
const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  feedback: z.string().optional(), // Optional feedback from student
})

export async function POST(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id')
    if (!studentId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const assignmentId = formData.get('assignmentId') as string
    const feedback = formData.get('feedback') as string
    const file = formData.get('file') as File

    // Validate required fields
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Assignment file is required' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG, GIF' },
        { status: 400 }
      )
    }

    // Get the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if assignment is published
    if (assignment.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Assignment is not available for submission' },
        { status: 400 }
      )
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        classId: assignment.classId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this class' },
        { status: 403 }
      )
    }

    // Check if assignment is past due date
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      return NextResponse.json(
        { error: 'Assignment submission is past the due date' },
        { status: 400 }
      )
    }

    // Save file to uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'assignments')
    await mkdir(uploadsDir, { recursive: true })
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    
    // Write file
    await writeFile(filePath, buffer)
    const fileUrl = `/uploads/assignments/${fileName}`

    // Check if student has already submitted (for resubmission handling)
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: assignmentId,
        studentId: studentId
      }
    })

    let submission

    if (existingSubmission) {
      // Update existing submission (resubmission)
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl: fileUrl,
          feedback: feedback || null,
          submittedAt: new Date(), // Update submission time
          grade: null, // Reset grade for new submission
          gradedAt: null,
          gradedBy: null
        }
      })
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentId,
          fileUrl: fileUrl,
          feedback: feedback || null
        }
      })
    }

    // Get professor information for email
    const professor = await prisma.user.findUnique({
      where: { id: assignment.professorId }
    })

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: assignment.classId }
    })

    // Send notification to professor
    try {
      const isResubmission = existingSubmission ? 'resubmitted' : 'submitted'
      await prisma.notification.create({
        data: {
          userId: assignment.professorId,
          title: 'Assignment Submission',
          message: `${student.name} has ${isResubmission} assignment "${assignment.title}"`,
          type: 'assignment'
        }
      })
    } catch (error) {
      console.error('Error sending notification to professor:', error)
    }

    // Send email notification to professor in background
    if (professor && classInfo) {
      sendAssignmentSubmissionEmail({
        studentName: student.name,
        assignmentTitle: assignment.title,
        className: classInfo.name,
        professorEmail: professor.email
      }).then((emailResult) => {
        if (emailResult.success) {
          console.log('Assignment submission email sent successfully')
        } else {
          console.error('Failed to send assignment submission email:', emailResult.error)
        }
      }).catch((emailError) => {
        console.error('Error sending assignment submission email:', emailError)
        // Don't fail the request if email fails, just log the error
      })
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      fileUrl: fileUrl,
      submittedAt: submission.submittedAt,
      isResubmission: !!existingSubmission
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
