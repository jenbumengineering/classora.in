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

    // Get classes based on user role
    let classes
    if (user.role === 'PROFESSOR') {
      // Professors see their own classes
      classes = await prisma.class.findMany({
        where: { professorId: userId },
        select: {
          id: true,
          name: true,
          code: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else {
      // Students see classes they're enrolled in
      classes = await prisma.class.findMany({
        where: {
          enrollments: {
            some: { studentId: userId }
          }
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    }

    // Get practice questions count for each class (using subject field)
    const classesWithQuestionCount = await Promise.all(
      classes.map(async (cls) => {
        const questionCount = await prisma.practiceQuestion.count({
          where: {
            subject: cls.name // Using class name as subject for now
          }
        })
        return {
          ...cls,
          questionCount
        }
      })
    )

    // Transform classes to include question count
    const transformedClasses = classesWithQuestionCount.map(cls => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      description: cls.description,
      questionCount: cls.questionCount
    }))

    return NextResponse.json({
      classes: transformedClasses,
      total: transformedClasses.length
    })
  } catch (error) {
    console.error('Error fetching practice classes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
