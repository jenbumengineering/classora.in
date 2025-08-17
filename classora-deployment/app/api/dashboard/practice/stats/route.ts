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

    // Get total practice questions available
    const totalQuestions = await prisma.practiceQuestion.count({
      where: {
        // Only count questions that are available to the user
        // For now, all questions are available to all users
      }
    })

    // Get user's practice question attempts
    const practiceAttempts = await prisma.practiceQuestionAttempt.findMany({
      where: { studentId: userId },
      include: {
        question: {
          select: {
            title: true,
            subject: true,
            difficulty: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    const completedQuestions = practiceAttempts.length

    // Calculate average score
    const averageScore = practiceAttempts.length > 0 
      ? Math.round(practiceAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / practiceAttempts.length)
      : 0

    // Calculate total time spent (in minutes)
    const timeSpent = practiceAttempts.reduce((total, attempt) => {
      if (attempt.completedAt && attempt.startedAt) {
        const timeDiff = new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()
        return total + Math.round(timeDiff / (1000 * 60)) // Convert to minutes
      }
      return total
    }, 0)

    // Get recent practice activity
    const recentActivity = practiceAttempts.slice(0, 10).map(attempt => ({
      id: attempt.id,
      title: attempt.question.title,
      subject: attempt.question.subject,
      difficulty: attempt.question.difficulty,
      score: attempt.score,
      isCorrect: attempt.isCorrect,
      time: attempt.startedAt
    }))

    // Format activity for frontend
    const formattedActivity = recentActivity.map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }))

    return NextResponse.json({
      totalQuestions,
      completedQuestions,
      averageScore,
      timeSpent,
      recentActivity: formattedActivity
    })
  } catch (error) {
    console.error('Error fetching practice stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 2592000)} months ago`
}
