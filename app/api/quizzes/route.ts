import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Validation schema for quiz queries
const quizQuerySchema = z.object({
  classId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

// Validation schema for creating a quiz
const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  noteId: z.string().optional(),
  timeLimit: z.number().min(1).max(180).default(30),
  maxAttempts: z.number().min(1).max(10).default(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
  questions: z.array(z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECTION', 'SHORT_ANSWER']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    correctAnswers: z.array(z.string()).optional(),
    points: z.number().min(1).max(10).default(1)
  })).min(1, 'At least one question is required')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const validatedData = quizQuerySchema.parse(Object.fromEntries(searchParams))

    // Get user ID from request
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build the where clause for filtering
    const whereClause: any = {}
    
    if (validatedData.classId) {
      whereClause.classId = validatedData.classId
    }
    
    if (validatedData.status) {
      whereClause.status = validatedData.status
    }

    // Filter quizzes based on user role
    if (user.role === 'PROFESSOR') {
      // Professors see their own quizzes
      whereClause.professorId = userId
    } else if (user.role === 'STUDENT') {
      // Students see quizzes from classes they are enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { classId: true }
      })
      
      const enrolledClassIds = enrollments.map(e => e.classId)
      if (enrolledClassIds.length === 0) {
        // If student is not enrolled in any classes, return empty list
        return NextResponse.json({
          quizzes: [],
          total: 0,
          limit: parseInt(validatedData.limit || '20'),
          offset: parseInt(validatedData.offset || '0')
        })
      }
      
      whereClause.classId = { in: enrolledClassIds }
    }

    // Fetch quizzes from database
    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
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
          select: {
            id: true
          }
        },
        attempts: user.role === 'STUDENT' ? {
          where: { studentId: userId },
          select: {
            id: true,
            score: true,
            completedAt: true
          },
          orderBy: {
            startedAt: 'desc'
          }
        } : false,
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(validatedData.limit || '20'),
      skip: parseInt(validatedData.offset || '0')
    })

    // Transform the data to match the expected format
    const transformedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      classId: quiz.classId,
      className: `${quiz.class.code} - ${quiz.class.name}`,
      totalQuestions: quiz._count.questions,
      timeLimit: quiz.timeLimit || 0,
      maxAttempts: quiz.maxAttempts || 1,
      status: quiz.status,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      professor: quiz.professor,
      attempts: quiz.attempts || []
    }))

    // Get total count for pagination
    const total = await prisma.quiz.count({
      where: whereClause
    })

    return NextResponse.json({
      quizzes: transformedQuizzes,
      total: total,
      limit: parseInt(validatedData.limit || '20'),
      offset: parseInt(validatedData.offset || '0')
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createQuizSchema.parse(body)

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
        { error: 'Only professors can create quizzes' },
        { status: 403 }
      )
    }

    // Verify the class exists and belongs to the professor
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId, professorId }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Create the quiz in the database
    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        type: 'STANDARD', // Default type for now
        status: validatedData.status,
        timeLimit: validatedData.timeLimit,
        maxAttempts: validatedData.maxAttempts,
        classId: validatedData.classId,
        professorId: professorId,
        noteId: validatedData.noteId || null,
      },
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
        }
      }
    })

    // Create questions for the quiz
    const questionsWithOptions = []
    for (let i = 0; i < validatedData.questions.length; i++) {
      const questionData = validatedData.questions[i]
      
      // Create the question
      const question = await prisma.question.create({
        data: {
          quizId: quiz.id,
          question: questionData.text,
          type: questionData.type,
          points: questionData.points,
          order: i + 1
        }
      })

      // Create options for multiple choice and multiple selection questions
      if (questionData.type === 'MULTIPLE_CHOICE' || questionData.type === 'MULTIPLE_SELECTION') {
        if (questionData.options && questionData.options.length > 0) {
          for (let j = 0; j < questionData.options.length; j++) {
            const option = questionData.options[j]
            const isCorrect = questionData.type === 'MULTIPLE_CHOICE' 
              ? questionData.correctAnswer === option
              : questionData.correctAnswers?.includes(option) || false

            await prisma.questionOption.create({
              data: {
                questionId: question.id,
                text: option,
                isCorrect: isCorrect,
                order: j + 1
              }
            })
          }
        }
      }

      questionsWithOptions.push(question)
    }

    // Return the created quiz with questions
    const createdQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
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

    // Send email notifications to enrolled students if quiz is published
    if (validatedData.status === 'PUBLISHED') {
      try {
        // Get all enrolled students
        const enrollments = await prisma.enrollment.findMany({
          where: { classId: validatedData.classId },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        // Send email to each enrolled student in background
        for (const enrollment of enrollments) {
          sendEmail(enrollment.student.email, 'newQuiz', {
            studentName: enrollment.student.name,
            quizTitle: validatedData.title,
            className: classData.name,
            timeLimit: validatedData.timeLimit,
            studentEmail: enrollment.student.email
          }).then(() => {
            console.log(`New quiz email sent to: ${enrollment.student.email}`)
          }).catch((emailError) => {
            console.error(`Failed to send email to ${enrollment.student.email}:`, emailError)
          })
        }
      } catch (notificationError) {
        console.error('Error sending quiz notifications:', notificationError)
        // Don't fail the quiz creation if email notifications fail
      }
    }

    return NextResponse.json(createdQuiz, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
