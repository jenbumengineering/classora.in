import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const questionId = params.id

    const question = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
      include: {
        options: {
          select: {
            id: true,
            text: true,
            isCorrect: true,
            explanation: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Transform the question to match frontend expectations
    const transformedQuestion = {
      id: question.id,
      title: question.title,
      content: question.content,
      type: question.type,
      class: question.subject, // Using subject as class for now
      difficulty: question.difficulty,
      points: question.points,
      timeLimit: question.timeLimit,
      options: question.options
    }

    return NextResponse.json({
      question: transformedQuestion
    })
  } catch (error) {
    console.error('Error fetching practice question:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
