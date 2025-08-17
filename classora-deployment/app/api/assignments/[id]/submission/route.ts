import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id
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

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if student has already submitted
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: assignmentId,
        studentId: studentId
      },
      select: {
        id: true,
        fileUrl: true,
        feedback: true,
        submittedAt: true,
        grade: true,
        gradedAt: true
      }
    })

    return NextResponse.json({
      hasSubmitted: !!submission,
      submission: submission
    })

  } catch (error) {
    console.error('Error checking assignment submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
