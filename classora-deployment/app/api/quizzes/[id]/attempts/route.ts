import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id
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

    // Get the quiz to verify it exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Get all attempts for this student and quiz
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quizId,
        studentId: studentId
      },
      orderBy: {
        startedAt: 'desc'
      },
      select: {
        id: true,
        score: true,
        timeSpent: true,
        startedAt: true,
        completedAt: true
      }
    })

    return NextResponse.json({
      attempts: attempts
    })
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
