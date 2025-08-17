import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
    })

    // Calculate total students across all classes
    const totalStudents = classes.reduce((sum, cls) => sum + cls._count.enrollments, 0)

    // Get quiz attempts and calculate average score based on best score per unique quiz per student
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          professorId
        }
      },
      select: {
        quizId: true,
        studentId: true,
        score: true
      }
    })

    // Calculate average score based on best score per unique quiz per student
    const bestScoresByQuizAndStudent = new Map<string, number>()
    
    quizAttempts.forEach(attempt => {
      const key = `${attempt.quizId}-${attempt.studentId}`
      const currentBest = bestScoresByQuizAndStudent.get(key)
      const attemptScore = attempt.score || 0
      
      if (currentBest === undefined || attemptScore > currentBest) {
        bestScoresByQuizAndStudent.set(key, attemptScore)
      }
    })
    
    const bestScores = Array.from(bestScoresByQuizAndStudent.values())
    const averageScore = bestScores.length > 0 
      ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
      : 0

    // Get pending submissions (assignments that have been submitted but not graded)
    const pendingSubmissions = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          professorId
        },
        grade: null // Not graded yet
      }
    })

    // Get recent activity
    const recentActivity = await prisma.$transaction([
      // Recent quiz attempts
      prisma.quizAttempt.findMany({
        where: {
          quiz: {
            professorId
          }
        },
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
          },
          student: {
            select: {
              name: true
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
        where: {
          assignment: {
            professorId
          }
        },
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
          },
          student: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      }),
      // Recent notes published
      prisma.note.findMany({
        where: {
          professorId,
          status: 'PUBLISHED'
        },
        include: {
          class: {
            select: {
              code: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ])

    // Combine and sort recent activity
    const allActivity = [
      ...recentActivity[0].map(attempt => ({
        id: `quiz-${attempt.id}`,
        type: 'quiz' as const,
        title: `${attempt.student.name} completed ${attempt.quiz.title}`,
        class: attempt.quiz.class.code,
        time: attempt.startedAt,
        score: attempt.score
      })),
      ...recentActivity[1].map(submission => ({
        id: `assignment-${submission.id}`,
        type: 'assignment' as const,
        title: `${submission.student.name} submitted ${submission.assignment.title}`,
        class: submission.assignment.class.code,
        time: submission.submittedAt
      })),
      ...recentActivity[2].map(note => ({
        id: `note-${note.id}`,
        type: 'note' as const,
        title: `Published: ${note.title}`,
        class: note.class.code,
        time: note.createdAt
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)

    // Format activity for frontend
    const formattedActivity = allActivity.map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }))

    return NextResponse.json({
      totalClasses: classes.length,
      totalStudents,
      totalNotes: classes.reduce((sum, cls) => sum + cls._count.notes, 0),
      totalQuizzes: classes.reduce((sum, cls) => sum + cls._count.quizzes, 0),
      totalAssignments: classes.reduce((sum, cls) => sum + cls._count.assignments, 0),
      averageScore,
      pendingSubmissions,
      recentActivity: formattedActivity
    })
  } catch (error) {
    console.error('Error fetching professor stats:', error)
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
