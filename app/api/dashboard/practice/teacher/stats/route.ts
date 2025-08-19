import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
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
        { error: 'Only professors can access this endpoint' },
        { status: 403 }
      )
    }

    // Get professor's classes
    const classes = await prisma.class.findMany({
      where: { professorId },
      select: { id: true, name: true }
    })

    const classNames = classes.map(cls => cls.name)

    // Get total practice questions created by the professor
    const totalQuestions = await prisma.practiceQuestion.count({
      where: {
        professorId: professorId
      }
    })

    // Get all practice attempts for questions created by this professor
    const practiceAttempts = await prisma.practiceQuestionAttempt.findMany({
      where: {
        question: {
          professorId: professorId
        }
      },
      include: {
        question: {
          select: {
            title: true,
            subject: true,
            difficulty: true
          }
        },
        student: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    const totalAttempts = practiceAttempts.length

    // Calculate average score
    const averageScore = practiceAttempts.length > 0 
      ? Math.round(practiceAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / practiceAttempts.length)
      : 0

    // Calculate total time spent (in minutes)
    const totalTimeSpent = practiceAttempts.reduce((total, attempt) => {
      if (attempt.completedAt && attempt.startedAt) {
        const timeDiff = new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()
        return total + Math.round(timeDiff / (1000 * 60)) // Convert to minutes
      }
      return total
    }, 0)

    // Get recent practice activity
    const recentActivity = practiceAttempts.slice(0, 10).map(attempt => ({
      id: attempt.id,
      title: `${attempt.student.name} completed ${attempt.question.title}`,
      time: attempt.startedAt,
      score: attempt.score,
      difficulty: attempt.question.difficulty
    }))

    return NextResponse.json({
      totalQuestions,
      totalAttempts,
      averageScore,
      totalTimeSpent,
      recentActivity
    })
  } catch (error) {
    console.error('Error fetching teacher practice stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
