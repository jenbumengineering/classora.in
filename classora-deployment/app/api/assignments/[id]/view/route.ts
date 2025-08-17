import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
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

    // Verify the student exists and is enrolled in the class
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        status: 'PUBLISHED',
        class: {
          enrollments: {
            some: {
              studentId: studentId
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Mark assignment as viewed by the student
    await prisma.studentAssignmentView.upsert({
      where: {
        studentId_assignmentId: {
          studentId: studentId,
          assignmentId: assignmentId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        studentId: studentId,
        assignmentId: assignmentId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking assignment as viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
