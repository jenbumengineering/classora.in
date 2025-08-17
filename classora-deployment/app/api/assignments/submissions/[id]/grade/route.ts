import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendAssignmentGradedEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id
    const professorId = request.headers.get('x-user-id')

    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { grade, feedback } = body

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        { error: 'Grade is required' },
        { status: 400 }
      )
    }

    if (typeof grade !== 'number' || grade < 0) {
      return NextResponse.json(
        { error: 'Grade must be a non-negative number' },
        { status: 400 }
      )
    }

    // Verify the professor exists and owns the assignment
    const submission = await prisma.assignmentSubmission.findFirst({
      where: { 
        id: submissionId,
        assignment: {
          professorId: professorId
        }
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            professorId: true
          }
        }
      }
    })

    if (!submission || !submission.assignment) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 404 }
      )
    }

    // Update the submission with grade and feedback
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: grade,
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedBy: professorId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Send notification to student
    try {
      await prisma.notification.create({
        data: {
          userId: updatedSubmission.studentId,
          title: 'Assignment Graded',
          message: `Your assignment "${updatedSubmission.assignment.title}" has been graded: ${grade}%`,
          type: 'assignment_graded'
        }
      })
    } catch (error) {
      console.error('Error sending notification to student:', error)
    }

    // Send email notification to student in background
    sendAssignmentGradedEmail({
      studentName: updatedSubmission.student.name,
      assignmentTitle: updatedSubmission.assignment.title,
      grade: `${grade}%`,
      feedback: feedback || undefined,
      studentEmail: updatedSubmission.student.email
    }).then((emailResult) => {
      if (emailResult.success) {
        console.log('Assignment graded email sent successfully')
      } else {
        console.error('Failed to send assignment graded email:', emailResult.error)
      }
    }).catch((emailError) => {
      console.error('Error sending assignment graded email:', emailError)
      // Don't fail the request if email fails, just log the error
    })

    return NextResponse.json({
      message: 'Submission graded successfully',
      submission: {
        id: updatedSubmission.id,
        studentId: updatedSubmission.studentId,
        studentName: updatedSubmission.student.name,
        studentEmail: updatedSubmission.student.email,
        grade: updatedSubmission.grade,
        feedback: updatedSubmission.feedback,
        gradedAt: updatedSubmission.gradedAt,
        assignmentTitle: updatedSubmission.assignment.title
      }
    })

  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
