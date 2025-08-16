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

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        classes: {
          include: {
            notes: true,
            quizzes: true,
            assignments: true,
            enrollments: {
              include: {
                student: true
              }
            }
          }
        },
        enrollments: {
          include: {
            class: true
          }
        },
        quizAttempts: {
          include: {
            quiz: true
          }
        },
        assignmentSubmissions: {
          include: {
            assignment: true
          }
        },
        practiceQuestionAttempts: {
          include: {
            question: true
          }
        },
        createdCalendarEvents: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare export data (exclude sensitive information)
    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: user.settings ? {
        notifications: JSON.parse(user.settings.notifications),
        privacy: JSON.parse(user.settings.privacy),
        appearance: JSON.parse(user.settings.appearance)
      } : null,
      classes: user.classes?.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        code: classItem.code,
        createdAt: classItem.createdAt,
        notes: classItem.notes?.length || 0,
        quizzes: classItem.quizzes?.length || 0,
        assignments: classItem.assignments?.length || 0,
        enrollments: classItem.enrollments?.length || 0
      })) || [],
      enrolledClasses: user.enrollments?.map(enrollment => ({
        classId: enrollment.class.id,
        className: enrollment.class.name,
        classCode: enrollment.class.code,
        enrolledAt: enrollment.enrolledAt
      })) || [],
      quizAttempts: user.quizAttempts?.map(attempt => ({
        quizId: attempt.quiz.id,
        quizTitle: attempt.quiz.title,
        score: attempt.score,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt
      })) || [],
      assignmentSubmissions: user.assignmentSubmissions?.map(submission => ({
        assignmentId: submission.assignment.id,
        assignmentTitle: submission.assignment.title,
        submittedAt: submission.submittedAt,
        grade: submission.grade,
        feedback: submission.feedback
      })) || [],
      practiceAttempts: user.practiceQuestionAttempts?.map(attempt => ({
        questionId: attempt.questionId,
        questionTitle: attempt.question.title,
        isCorrect: attempt.isCorrect,
        score: attempt.score,
        attemptedAt: attempt.startedAt
      })) || [],
      calendarEvents: user.createdCalendarEvents?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        date: event.date,
        category: event.category,
        priority: event.priority,
        createdAt: event.createdAt
      })) || [],
      exportDate: new Date().toISOString()
    }

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2)
    
    // Create response with proper headers for file download
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${userId}.json"`
      }
    })

  } catch (error) {
    console.error('Error exporting user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
