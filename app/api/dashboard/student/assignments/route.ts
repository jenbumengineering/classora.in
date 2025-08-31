import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id')
    if (!studentId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Only students can access this endpoint' },
        { status: 403 }
      )
    }

    // Get assignment submissions with assignment and class information
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId },
      include: {
        assignment: {
          select: {
            title: true,
            class: {
              select: {
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 20 // Limit to recent 20 submissions
    })

    // Format the data
    const assignments = submissions.map(submission => ({
      id: submission.id,
      title: submission.assignment.title,
      class: submission.assignment.class.code,
      grade: submission.grade,
      submittedAt: submission.submittedAt.toLocaleDateString()
    }))

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching assignment submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
