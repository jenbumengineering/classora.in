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

    // Get quiz attempts with quiz and class information
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      include: {
        quiz: {
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
        startedAt: 'desc'
      },
      take: 20 // Limit to recent 20 attempts
    })

    // Format the data
    const quizzes = quizAttempts.map(attempt => ({
      id: attempt.id,
      title: attempt.quiz.title,
      class: attempt.quiz.class.code,
      score: attempt.score || 0,
      date: attempt.startedAt.toLocaleDateString()
    }))

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Error fetching quiz performance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
