import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'PROFESSOR' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Only professors can access this endpoint' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subject = searchParams.get('subject')

    if (!classId && !subject) {
      return NextResponse.json(
        { error: 'Class ID or subject is required' },
        { status: 400 }
      )
    }

    // Build where clause
    let whereClause: any = {
      professorId: userId
    }

    if (classId) {
      whereClause.classId = classId
    }

    // Get quizzes with their questions
    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      include: {
        questions: {
          include: {
            options: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform questions to match practice question format
    const transformedQuestions = quizzes.flatMap(quiz => 
      quiz.questions.map(question => ({
        id: question.id,
        title: question.question,
        content: question.question,
        type: question.type,
        difficulty: 'MEDIUM', // Default difficulty for imported questions
        points: question.points,
        timeLimit: undefined,
        options: question.options.map(opt => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: '' // No explanation in quiz questions
        })),
        source: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          classId: quiz.classId,
          className: quiz.class.name,
          classCode: quiz.class.code
        }
      }))
    )

    // Filter by subject if provided
    const filteredQuestions = subject 
      ? transformedQuestions.filter(q => q.source.className.toLowerCase().includes(subject.toLowerCase()))
      : transformedQuestions

    return NextResponse.json({
      questions: filteredQuestions,
      total: filteredQuestions.length
    })
  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
