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

    // Get student's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { classId: true }
    })

    const classIds = enrollments.map(e => e.classId)

    // Get unread assignments count
    const unreadAssignments = await prisma.assignment.count({
      where: {
        classId: { in: classIds },
        status: 'PUBLISHED',
        studentViews: {
          none: {
            studentId: studentId
          }
        }
      }
    })

    // Get unread quizzes count
    const unreadQuizzes = await prisma.quiz.count({
      where: {
        classId: { in: classIds },
        status: 'PUBLISHED',
        studentViews: {
          none: {
            studentId: studentId
          }
        }
      }
    })

    // Get unread notes count
    const unreadNotes = await prisma.note.count({
      where: {
        classId: { in: classIds },
        status: 'PUBLISHED',
        studentViews: {
          none: {
            studentId: studentId
          }
        }
      }
    })

    return NextResponse.json({
      unreadAssignments,
      unreadQuizzes,
      unreadNotes,
      totalUnread: unreadAssignments + unreadQuizzes + unreadNotes
    })

  } catch (error) {
    console.error('Error fetching unread counts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
