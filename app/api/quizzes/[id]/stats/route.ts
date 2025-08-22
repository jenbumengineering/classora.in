import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
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
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, professorId },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            points: true
          }
        },
        attempts: {
          select: {
            id: true,
            score: true,
            timeSpent: true,
            completedAt: true,
            student: {
              select: {
                name: true
              }
            },
            answers: {
              select: {
                questionId: true,
                isCorrect: true,
                points: true
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate statistics
    const totalAttempts = quiz._count.attempts
    const completedAttempts = quiz.attempts.filter(attempt => attempt.completedAt)
    
    let averageScore = 0
    let highestScore = 0
    let lowestScore = 100
    let totalTimeSpent = 0

    if (completedAttempts.length > 0) {
      const scores = completedAttempts.map(attempt => {
        // Use the stored score from the attempt, not recalculated from answers
        const score = attempt.score || 0
        
        if (score > highestScore) highestScore = score
        if (score < lowestScore) lowestScore = score
        
        const timeSpent = attempt.timeSpent || 0
        totalTimeSpent += timeSpent
        
        return score
      })
      
      averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    }

    // Handle edge cases
    if (completedAttempts.length === 0) {
      lowestScore = 0
      highestScore = 0
    }

    const averageTimeSpent = completedAttempts.length > 0 ? totalTimeSpent / completedAttempts.length : 0
    const completionRate = totalAttempts > 0 ? (completedAttempts.length / totalAttempts) * 100 : 0

    // Calculate question statistics
    const questionStats = quiz.questions.map(question => {
      // Get all answers for this question from all attempts
      const questionAnswers = quiz.attempts.flatMap(attempt => 
        attempt.answers.filter(answer => answer.questionId === question.id)
      )
      
      const totalAnswers = questionAnswers.length
      const correctAnswers = questionAnswers.filter(answer => answer.isCorrect).length
      const successRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

      return {
        questionId: question.id,
        questionText: question.question,
        correctAnswers,
        totalAnswers,
        successRate
      }
    })

    // Format recent attempts
    const recentAttempts = quiz.attempts.slice(0, 10).map(attempt => {
      // Use the stored score from the attempt
      const score = attempt.score || 0

      return {
        id: attempt.id,
        studentName: attempt.student.name,
        score: Math.round(score),
        timeSpent: attempt.timeSpent || 0,
        completedAt: attempt.completedAt?.toISOString() || ''
      }
    })

    const stats = {
      id: quiz.id,
      title: quiz.title,
      totalAttempts,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore: Math.round(highestScore),
      lowestScore: Math.round(lowestScore),
      completionRate: Math.round(completionRate * 10) / 10,
      averageTimeSpent: Math.round(averageTimeSpent),
      questionStats,
      recentAttempts
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching quiz stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
