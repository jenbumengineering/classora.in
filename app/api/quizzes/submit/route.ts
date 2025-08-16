import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for quiz submission
const quizSubmissionSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  startTime: z.string().optional(), // ISO string of when the quiz was started
  answers: z.array(z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    selectedOptions: z.array(z.string()).optional(), // For multiple choice/selection
    textAnswer: z.string().optional(), // For short answer
  })).min(1, 'At least one answer is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = quizSubmissionSchema.parse(body)

    // Get student ID from request
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

    // Get the quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: validatedData.quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if student has reached the maximum number of attempts
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: validatedData.quizId,
        studentId: studentId
      }
    })

    if (existingAttempts.length >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum number of attempts (${quiz.maxAttempts}) for this quiz` },
        { status: 400 }
      )
    }

    // Calculate time spent
    const timeSpent = validatedData.startTime 
      ? Math.floor((Date.now() - new Date(validatedData.startTime).getTime()) / 1000) 
      : null

    // Create quiz attempt first
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: validatedData.quizId,
        studentId: studentId,
        score: 0, // Will be calculated and updated
        timeSpent: timeSpent,
        completedAt: new Date()
      }
    })

    // Process answers and calculate score
    let totalScore = 0
    let totalPoints = 0

    for (const answerData of validatedData.answers) {
      const question = quiz.questions.find(q => q.id === answerData.questionId)
      if (!question) continue

      totalPoints += question.points
      let isCorrect = false
      let points = 0

      // Process different question types
      switch (question.type) {
        case 'MULTIPLE_CHOICE':
          const correctOption = question.options.find(opt => opt.isCorrect)
          isCorrect = answerData.selectedOptions?.[0] === correctOption?.text
          points = isCorrect ? question.points : 0
          break

        case 'MULTIPLE_SELECTION':
          const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.text)
          const selectedOptions = answerData.selectedOptions || []
          isCorrect = correctOptions.length === selectedOptions.length &&
                     correctOptions.every(opt => selectedOptions.includes(opt))
          points = isCorrect ? question.points : 0
          break

        case 'TRUE_FALSE':
          const correctAnswer = question.options.find(opt => opt.isCorrect)?.text
          isCorrect = answerData.selectedOptions?.[0] === correctAnswer
          points = isCorrect ? question.points : 0
          break

        case 'SHORT_ANSWER':
          // For short answer, we'll need manual grading
          isCorrect = false
          points = 0
          break

        default:
          // Handle any other question types
          isCorrect = false
          points = 0
          break
      }

      totalScore += points

      // Create answer record with correct attemptId
      await prisma.answer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedOptions: answerData.selectedOptions ? JSON.stringify(answerData.selectedOptions) : null,
          isCorrect: isCorrect,
          points: points
        }
      })
    }

    // Update attempt with final score
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: { score: totalScore }
    })

    // Calculate percentage
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score: totalScore,
      totalPoints: totalPoints,
      percentage: percentage,
      completedAt: attempt.completedAt
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
