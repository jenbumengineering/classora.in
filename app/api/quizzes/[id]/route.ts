import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for updating a quiz
const updateQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  timeLimit: z.number().min(1).max(180).optional(),
  maxAttempts: z.number().min(1).max(10).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
  questions: z.array(z.object({
    id: z.string().optional(), // For existing questions
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECTION', 'SHORT_ANSWER']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    correctAnswers: z.array(z.string()).optional(),
    points: z.number().min(1).max(10).default(1)
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        questions: {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
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

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id
    const body = await request.json()
    console.log('Received quiz update request:', { quizId, body })
    const validatedData = updateQuizSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the quiz exists and belongs to the professor
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId, professorId }
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found or access denied' },
        { status: 404 }
      )
    }

    // Start a transaction to update quiz and questions
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Update the quiz basic info
      const quiz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          timeLimit: validatedData.timeLimit,
          maxAttempts: validatedData.maxAttempts,
          status: validatedData.status,
        }
      })

      // Handle questions if provided
      if (validatedData.questions) {
        // Delete all existing questions (cascade will handle options and coding questions)
        await tx.question.deleteMany({
          where: { quizId }
        })

        // Create new questions
        for (let i = 0; i < validatedData.questions.length; i++) {
          const questionData = validatedData.questions[i]
          
          // Create the question
          const question = await tx.question.create({
            data: {
              quizId,
              question: questionData.text,
              type: questionData.type,
              points: questionData.points,
              order: i + 1
            }
          })

          // Handle options for multiple choice and multiple selection
          if (questionData.options && questionData.options.length > 0) {
            const optionsData = questionData.options.map((optionText, index) => ({
              questionId: question.id,
              text: optionText,
              isCorrect: questionData.type === 'MULTIPLE_CHOICE' 
                ? questionData.correctAnswer === optionText
                : questionData.type === 'MULTIPLE_SELECTION'
                ? questionData.correctAnswers?.includes(optionText) || false
                : false,
              order: index + 1
            }))
            
            await tx.questionOption.createMany({
              data: optionsData
            })
          }
        }
      }

      // Return the updated quiz with questions
      return await tx.quiz.findUnique({
        where: { id: quizId },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          professor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          questions: {
            include: {
              options: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      })
    })

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the quiz exists and belongs to the professor
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId, professorId }
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the quiz (cascade will handle related data)
    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
