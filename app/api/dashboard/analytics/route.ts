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

    // Verify user is a professor
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json(
        { error: 'Access denied. Professor role required.' },
        { status: 403 }
      )
    }

    // Get professor's classes
    const classes = await prisma.class.findMany({
      where: { professorId: userId },
      include: {
        enrollments: {
          include: {
            student: true
          }
        },
        notes: true,
        quizzes: {
          include: {
            attempts: true
          }
        },
        assignments: {
          include: {
            submissions: true
          }
        }
      }
    })

    // Calculate analytics - count unique students across all classes
    const allEnrollments = classes.flatMap(classItem => classItem.enrollments)
    const uniqueStudentIds = new Set(allEnrollments.map(enrollment => enrollment.student.id))
    const totalStudents = uniqueStudentIds.size

    const totalClasses = classes.length

    // Calculate average grade across all quiz attempts and assignment submissions
    const allQuizAttempts = classes.flatMap(classItem => 
      classItem.quizzes.flatMap(quiz => quiz.attempts)
    )

    const allAssignmentSubmissions = classes.flatMap(classItem => 
      classItem.assignments.flatMap(assignment => assignment.submissions)
    )

    const totalGrades = [
      ...allQuizAttempts.map(attempt => attempt.score || 0),
      ...allAssignmentSubmissions.map(submission => submission.grade || 0)
    ].filter(grade => grade > 0)

    const averageGrade = totalGrades.length > 0 
      ? Math.round((totalGrades.reduce((sum, grade) => sum + grade, 0) / totalGrades.length) * 100) / 100
      : 0

    // Calculate completion rate (unique students who submitted assignments vs total students)
    const totalAssignments = classes.reduce((sum, classItem) => 
      sum + classItem.assignments.length, 0
    )
    
    const studentsWithSubmissions = new Set(allAssignmentSubmissions.map(submission => submission.studentId))
    const completionRate = totalStudents > 0 
      ? Math.round((studentsWithSubmissions.size / totalStudents) * 100)
      : 0

    // Calculate active students (students with activity in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentQuizAttempts = allQuizAttempts.filter(attempt => 
      new Date(attempt.startedAt) >= thirtyDaysAgo
    )
    
    const recentSubmissions = allAssignmentSubmissions.filter(submission => 
      new Date(submission.submittedAt) >= thirtyDaysAgo
    )

    const activeStudentIds = new Set([
      ...recentQuizAttempts.map(attempt => attempt.studentId),
      ...recentSubmissions.map(submission => submission.studentId)
    ])

    const activeStudents = activeStudentIds.size

    // Count content
    const totalNotes = classes.reduce((sum, classItem) => 
      sum + classItem.notes.length, 0
    )

    const totalQuizzes = classes.reduce((sum, classItem) => 
      sum + classItem.quizzes.length, 0
    )

    // Generate monthly stats for the last 6 months
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleString('default', { month: 'short' })
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthEnrollments = classes.flatMap(classItem => 
        classItem.enrollments.filter(enrollment => 
          enrollment.enrolledAt >= monthStart && enrollment.enrolledAt <= monthEnd
        )
      )

      const monthAssignments = classes.flatMap(classItem => 
        classItem.assignments.filter(assignment => 
          assignment.createdAt >= monthStart && assignment.createdAt <= monthEnd
        )
      )

      const monthQuizzes = classes.flatMap(classItem => 
        classItem.quizzes.filter(quiz => 
          quiz.createdAt >= monthStart && quiz.createdAt <= monthEnd
        )
      )

      monthlyStats.push({
        month: monthName,
        students: monthEnrollments.length,
        assignments: monthAssignments.length,
        quizzes: monthQuizzes.length
      })
    }

    // Calculate performance metrics
    const totalQuizAttempts = allQuizAttempts.length
    const successfulQuizAttempts = allQuizAttempts.filter(attempt => 
      attempt.score && attempt.score >= 70
    ).length

    const studentEngagement = totalStudents > 0 
      ? Math.round((activeStudents / totalStudents) * 100)
      : 0

    const quizPerformance = totalQuizAttempts > 0 
      ? Math.round((successfulQuizAttempts / totalQuizAttempts) * 100)
      : 0

    // Calculate content consumption per student
    const totalContent = totalNotes + totalQuizzes + totalAssignments
    const contentConsumption = totalStudents > 0 
      ? Math.round(totalContent / totalStudents)
      : 0

    return NextResponse.json({
      totalStudents,
      totalClasses,
      averageGrade,
      completionRate,
      activeStudents,
      totalAssignments,
      totalQuizzes,
      totalNotes,
      monthlyStats,
      performanceMetrics: {
        studentEngagement,
        assignmentCompletion: completionRate,
        quizPerformance,
        contentConsumption
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
