import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const professorId = request.headers.get('x-user-id')
    const studentId = params.id
    
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is a professor
    const user = await prisma.user.findUnique({
      where: { id: professorId }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json(
        { error: 'Access denied. Professor role required.' },
        { status: 403 }
      )
    }

    // Get student details and verify they're enrolled in professor's classes
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        class: {
          professorId: professorId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            _count: {
              select: {
                notes: true,
                quizzes: true,
                assignments: true
              }
            }
          }
        }
      }
    })

    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: 'Student not found or not enrolled in your classes' },
        { status: 404 }
      )
    }

    const student = enrollments[0].student
    const classes = enrollments.map(enrollment => ({
      id: enrollment.class.id,
      name: enrollment.class.name,
      code: enrollment.class.code,
      enrolledAt: enrollment.enrolledAt,
      _count: enrollment.class._count
    }))

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId: studentId,
        quiz: {
          professorId: professorId
        }
      },
      include: {
        quiz: {
          select: {
            title: true,
            class: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Get assignment submissions
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: studentId,
        assignment: {
          professorId: professorId
        }
      },
      include: {
        assignment: {
          select: {
            title: true,
            class: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Calculate average grade
    const grades = [
      ...quizAttempts.map(attempt => attempt.score || 0),
      ...assignmentSubmissions.map(submission => submission.grade || 0)
    ].filter(grade => grade > 0)

    const averageGrade = grades.length > 0 
      ? Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 100) / 100
      : 0

    // Find last activity
    const lastQuizActivity = quizAttempts.length > 0 
      ? Math.max(...quizAttempts.map(attempt => new Date(attempt.completedAt || attempt.startedAt).getTime()))
      : 0
    
    const lastSubmissionActivity = assignmentSubmissions.length > 0
      ? Math.max(...assignmentSubmissions.map(submission => new Date(submission.submittedAt).getTime()))
      : 0
    
    const lastEnrollmentActivity = Math.max(...enrollments.map(enrollment => new Date(enrollment.enrolledAt).getTime()))
    const lastActivity = Math.max(lastQuizActivity, lastSubmissionActivity, lastEnrollmentActivity)

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      enrolledClasses: classes.length,
      averageGrade,
      lastActive: new Date(lastActivity).toISOString(),
      classes,
      quizAttempts: quizAttempts.map(attempt => ({
        id: attempt.id,
        quizTitle: attempt.quiz.title,
        className: attempt.quiz.class.name,
        score: attempt.score || 0,
        completedAt: attempt.completedAt || attempt.startedAt
      })),
      assignmentSubmissions: assignmentSubmissions.map(submission => ({
        id: submission.id,
        assignmentTitle: submission.assignment.title,
        className: submission.assignment.class.name,
        grade: submission.grade,
        submittedAt: submission.submittedAt
      }))
    })

  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
