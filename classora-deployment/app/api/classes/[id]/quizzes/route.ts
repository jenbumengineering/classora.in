import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classId = params.id

    // Verify the class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Fetch only published quizzes for the class
    const quizzes = await prisma.quiz.findMany({
      where: {
        classId: classId,
        status: 'PUBLISHED'
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
        },
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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
      status: quiz.status,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
      professor: quiz.professor
    }))

    return NextResponse.json({
      quizzes: transformedQuizzes,
      total: transformedQuizzes.length
    })
  } catch (error) {
    console.error('Error fetching public quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
