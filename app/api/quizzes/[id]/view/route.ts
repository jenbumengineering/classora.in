import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
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

    // Verify the student exists and is enrolled in the class
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
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

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or access denied' },
        { status: 404 }
      )
    }

    // Mark quiz as viewed by the student
    await prisma.studentQuizView.upsert({
      where: {
        studentId_quizId: {
          studentId: studentId,
          quizId: quizId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        studentId: studentId,
        quizId: quizId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking quiz as viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
