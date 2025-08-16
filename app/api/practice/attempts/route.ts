import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPracticeAttemptSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswers: z.array(z.string()).min(1, 'At least one answer is required'),
  timeSpent: z.number().min(0, 'Time spent must be non-negative')
})

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'STUDENT' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Only students can submit practice attempts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createPracticeAttemptSchema.parse(body)

    // Get the question with its correct answers
    const question = await prisma.practiceQuestion.findUnique({
      where: { id: validatedData.questionId },
      include: {
        options: {
          where: { isCorrect: true },
          select: { id: true }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // Get correct answer IDs
    const correctAnswerIds = question.options.map(opt => opt.id)
    
    // Check if the answer is correct
    const isCorrect = question.type === 'MULTIPLE_SELECTION' 
      ? correctAnswerIds.length === validatedData.selectedAnswers.length &&
        correctAnswerIds.every(id => validatedData.selectedAnswers.includes(id))
      : validatedData.selectedAnswers.length === 1 &&
        correctAnswerIds.includes(validatedData.selectedAnswers[0])

    // Calculate score
    const score = isCorrect ? question.points : 0

    // Create the attempt
    const attempt = await prisma.practiceQuestionAttempt.create({
      data: {
        questionId: validatedData.questionId,
        studentId: userId,
        selectedOptions: JSON.stringify(validatedData.selectedAnswers),
        isCorrect,
        score
      }
    })

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        questionId: attempt.questionId,
        studentId: attempt.studentId,
        selectedOptions: attempt.selectedOptions,
        isCorrect: attempt.isCorrect,
        score: attempt.score,
        submittedAt: attempt.startedAt.toISOString()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating practice attempt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
