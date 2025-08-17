import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for creating a practice question
const createPracticeQuestionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE', 'SHORT_ANSWER']),
  subject: z.string().min(1, 'Subject is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z.number().min(1).max(100),
  timeLimit: z.number().min(1).max(60).optional(),
  options: z.array(z.object({
    text: z.string().min(1, 'Option text is required'),
    isCorrect: z.boolean(),
    explanation: z.string().optional() // Explanation for correct answers
  })).optional(),
  professorId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    // Build where clause
    let whereClause: any = {}
    if (classId) {
      // Get class name to match with subject
      const classData = await prisma.class.findUnique({
        where: { id: classId }
      })
      if (classData) {
        whereClause.subject = classData.name
      }
    }

    // Get practice questions with class information
    const questions = await prisma.practiceQuestion.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            attempts: true
          }
        },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform questions to include class information
    const transformedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      content: question.content,
      type: question.type,
      class: question.subject, // Using subject as class for now
      difficulty: question.difficulty,
      points: question.points,
      timeLimit: question.timeLimit,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      _count: question._count,
      options: question.options
    }))

    return NextResponse.json({
      questions: transformedQuestions,
      total: transformedQuestions.length
    })
  } catch (error) {
    console.error('Error fetching practice questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPracticeQuestionSchema.parse(body)

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a professor
    const professor = await prisma.user.findUnique({
      where: { id: professorId, role: 'PROFESSOR' }
    })

    if (!professor) {
      return NextResponse.json(
        { error: 'Only professors can create practice questions' },
        { status: 403 }
      )
    }

    // Create the practice question in the database
    const question = await prisma.practiceQuestion.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        subject: validatedData.subject,
        difficulty: validatedData.difficulty,
        points: validatedData.points,
        timeLimit: validatedData.timeLimit,
        professorId: professorId,
      },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      }
    })

    // If it's a question with options, create them
    if (['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(validatedData.type) && validatedData.options) {
      for (let i = 0; i < validatedData.options.length; i++) {
        const option = validatedData.options[i]

        await prisma.practiceQuestionOption.create({
          data: {
            questionId: question.id,
            text: option.text,
            isCorrect: option.isCorrect,
            explanation: option.explanation,
            order: i + 1
          }
        })
      }
    }

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating practice question:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
