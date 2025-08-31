import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id')
    if (!studentId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Only students can access this endpoint' },
        { status: 403 }
      )
    }

    // Get student's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            _count: {
              select: {
                enrollments: true,
                notes: true,
                quizzes: true,
                assignments: true
              }
            }
          }
        }
      }
    })

    // Get quiz attempts and calculate progress
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      select: {
        quizId: true,
        score: true
      }
    })

    // Get total available quizzes from enrolled classes
    const totalQuizzes = enrollments.reduce((sum, enrollment) => 
      sum + enrollment.class._count.quizzes, 0
    )

    // Count unique quizzes attempted (not total attempts)
    const uniqueQuizIds = Array.from(new Set(quizAttempts.map(attempt => attempt.quizId)))
    const completedQuizzes = uniqueQuizIds.length
    
    // Calculate average score based on best score per unique quiz
    const bestScoresByQuiz = new Map<string, number>()
    
    quizAttempts.forEach(attempt => {
      const currentBest = bestScoresByQuiz.get(attempt.quizId)
      const attemptScore = attempt.score || 0
      
      if (currentBest === undefined || attemptScore > currentBest) {
        bestScoresByQuiz.set(attempt.quizId, attemptScore)
      }
    })
    
    const bestScores = Array.from(bestScoresByQuiz.values())
    const averageScore = bestScores.length > 0 
      ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
      : 0

    // Get assignment submissions
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: { studentId },
      select: {
        id: true
      }
    })

    // Get total available assignments from enrolled classes
    const totalAssignments = enrollments.reduce((sum, enrollment) => 
      sum + enrollment.class._count.assignments, 0
    )

    const completedAssignments = assignmentSubmissions.length

    // Calculate study streak (consecutive days with activity)
    const allActivityDates = [
      ...quizAttempts.map(attempt => new Date().toDateString()), // Simplified for now
      ...assignmentSubmissions.map(submission => new Date().toDateString())
    ]
    const uniqueActivityDates = Array.from(new Set(allActivityDates))
    
    let studyStreak = uniqueActivityDates.length > 0 ? 1 : 0

    // Get recent activity
    const recentActivity = await prisma.$transaction([
      // Recent quiz attempts
      prisma.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: {
            select: {
              title: true,
              class: {
                select: {
                  code: true
                }
              }
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        },
        take: 5
      }),
      // Recent assignment submissions
      prisma.assignmentSubmission.findMany({
        where: { studentId },
        include: {
          assignment: {
            select: {
              title: true,
              class: {
                select: {
                  code: true
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      })
    ])

    // Combine and format recent activity
    const allActivity = [
      ...recentActivity[0].map(attempt => ({
        id: `quiz-${attempt.id}`,
        type: 'quiz' as const,
        title: attempt.quiz.title,
        class: attempt.quiz.class.code,
        score: attempt.score,
        time: attempt.startedAt
      })),
      ...recentActivity[1].map(submission => ({
        id: `assignment-${submission.id}`,
        type: 'assignment' as const,
        title: submission.assignment.title,
        class: submission.assignment.class.code,
        time: submission.submittedAt
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)

    // Get upcoming deadlines for the next 7 days
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
    
    // Get upcoming assignments with completion status
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        classId: {
          in: enrollments.map(e => e.classId)
        },
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow
        },
        status: 'PUBLISHED'
      },
      include: {
        class: {
          select: {
            code: true
          }
        },
        submissions: {
          where: { studentId },
          select: { id: true, grade: true }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Get upcoming quizzes with completion status
    const upcomingQuizzes = await prisma.quiz.findMany({
      where: {
        classId: {
          in: enrollments.map(e => e.classId)
        },
        status: 'PUBLISHED'
      },
      include: {
        class: {
          select: {
            code: true
          }
        },
        attempts: {
          where: { studentId },
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Combine and format upcoming deadlines with completion status
    const upcomingDeadlinesList = [
      ...upcomingAssignments.map(assignment => ({
        id: `assignment-${assignment.id}`,
        type: 'assignment' as const,
        title: assignment.title,
        class: assignment.class.code,
        dueDate: formatDueDate(assignment.dueDate),
        completed: assignment.submissions.length > 0,
        graded: assignment.submissions.some(sub => sub.grade !== null),
        assignmentId: assignment.id
      })),
      ...upcomingQuizzes.map(quiz => ({
        id: `quiz-${quiz.id}`,
        type: 'quiz' as const,
        title: quiz.title,
        class: quiz.class.code,
        dueDate: 'Available now',
        completed: quiz.attempts.length > 0,
        quizId: quiz.id
      }))
    ].sort((a, b) => {
      // Sort assignments by due date, quizzes after
      if (a.type === 'assignment' && b.type === 'assignment') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.type === 'assignment') return -1
      if (b.type === 'assignment') return 1
      return 0
    }).slice(0, 10) // Limit to 10 items

    // Format activity for frontend
    const formattedActivity = allActivity.map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }))

    const response = NextResponse.json({
      enrolledClasses: enrollments.length,
      completedQuizzes,
      totalQuizzes,
      completedAssignments,
      totalAssignments,
      averageScore,
      studyStreak,
      upcomingDeadlines: upcomingDeadlinesList.length,
      recentActivity: formattedActivity,
      upcomingDeadlinesList,
      debug: {
        calculationTime: new Date().toISOString(),
        bestScoresCount: bestScores.length,
        totalAttempts: quizAttempts.length,
        uniqueQuizzes: uniqueQuizIds.length
      }
    })
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching student stats:', error)
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

function formatDueDate(dueDate: Date | null): string {
  if (!dueDate) return 'No due date'
  
  const now = new Date()
  const diffInDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) return 'Overdue'
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Tomorrow'
  if (diffInDays < 7) return `${diffInDays} days`
  if (diffInDays < 14) return 'Next week'
  return dueDate.toLocaleDateString()
}
