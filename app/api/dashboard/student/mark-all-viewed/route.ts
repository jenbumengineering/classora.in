import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
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

    // Mark all unread assignments as viewed
    const unreadAssignments = await prisma.assignment.findMany({
      where: {
        classId: { in: classIds },
        status: 'PUBLISHED',
        studentViews: {
          none: {
            studentId: studentId
          }
        }
      },
      select: { id: true }
    })

    // Create view records for unread assignments
    if (unreadAssignments.length > 0) {
      await prisma.studentAssignmentView.createMany({
        data: unreadAssignments.map(assignment => ({
          studentId: studentId,
          assignmentId: assignment.id
        }))
      })
    }

    // Mark all unread quizzes as viewed
    const unreadQuizzes = await prisma.quiz.findMany({
      where: {
        classId: { in: classIds },
        status: 'PUBLISHED',
        studentViews: {
          none: {
            studentId: studentId
          }
        }
      },
      select: { id: true }
    })

    // Create view records for unread quizzes
    if (unreadQuizzes.length > 0) {
      await prisma.studentQuizView.createMany({
        data: unreadQuizzes.map(quiz => ({
          studentId: studentId,
          quizId: quiz.id
        }))
      })
    }

    // Mark all unread notes as viewed
    const unreadNotes = await prisma.note.findMany({
      where: {
        classId: { in: classIds },
        status: 'PUBLISHED',
        studentViews: {
          none: {
            studentId: studentId
          }
        }
      },
      select: { id: true }
    })

    // Create view records for unread notes
    if (unreadNotes.length > 0) {
      await prisma.studentNoteView.createMany({
        data: unreadNotes.map(note => ({
          studentId: studentId,
          noteId: note.id
        }))
      })
    }

    return NextResponse.json({
      success: true,
      markedAssignments: unreadAssignments.length,
      markedQuizzes: unreadQuizzes.length,
      markedNotes: unreadNotes.length
    })

  } catch (error) {
    console.error('Error marking all content as viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
