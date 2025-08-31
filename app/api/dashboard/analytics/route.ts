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

    // Calculate best scores per quiz per student for more accurate average
    const bestScoresByQuizAndStudent = new Map<string, number>()
    
    allQuizAttempts.forEach(attempt => {
      const key = `${attempt.quizId}-${attempt.studentId}`
      const currentBest = bestScoresByQuizAndStudent.get(key)
      const attemptScore = attempt.score || 0
      
      if (currentBest === undefined || attemptScore > currentBest) {
        bestScoresByQuizAndStudent.set(key, attemptScore)
      }
    })
    
    const bestQuizScores = Array.from(bestScoresByQuizAndStudent.values())
    const assignmentGrades = allAssignmentSubmissions.map(submission => submission.grade || 0).filter(grade => grade > 0)
    
    const totalGrades = [...bestQuizScores, ...assignmentGrades]
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

    // Calculate quiz performance based on best scores per quiz per student
    const successfulBestScores = bestQuizScores.filter(score => score >= 70).length
    const quizPerformance = bestQuizScores.length > 0 
      ? Math.round((successfulBestScores / bestQuizScores.length) * 100)
      : 0

    // Calculate content consumption per student
    const totalContent = totalNotes + totalQuizzes + totalAssignments
    const contentConsumption = totalStudents > 0 
      ? Math.round(totalContent / totalStudents)
      : 0

    // Generate detailed class analytics
    const classAnalytics = await Promise.all(classes.map(async (classItem) => {
      // Get attendance data for this class
      const attendanceSessions = await prisma.attendanceSession.findMany({
        where: { classId: classItem.id },
        include: {
          records: {
            include: {
              student: true
            }
          }
        }
      })

      // Calculate attendance statistics
      const allAttendanceRecords = attendanceSessions.flatMap(session => session.records)
      const totalSessions = attendanceSessions.length
      const presentCount = allAttendanceRecords.filter(record => record.status === 'PRESENT').length
      const absentCount = allAttendanceRecords.filter(record => record.status === 'ABSENT').length
      const lateCount = allAttendanceRecords.filter(record => record.status === 'LATE').length
      const excusedCount = allAttendanceRecords.filter(record => record.status === 'EXCUSED').length
      const averageAttendance = totalSessions > 0 ? (presentCount / (presentCount + absentCount + lateCount + excusedCount)) * 100 : 0

      // Calculate attendance by student
      const attendanceByStudent = new Map<string, { present: number, total: number, studentName: string, studentEmail: string }>()
      allAttendanceRecords.forEach(record => {
        const key = record.studentId
        const current = attendanceByStudent.get(key) || { present: 0, total: 0, studentName: record.student.name, studentEmail: record.student.email }
        current.total++
        if (record.status === 'PRESENT') current.present++
        attendanceByStudent.set(key, current)
      })

      const topAttendees = Array.from(attendanceByStudent.entries())
        .map(([studentId, data]) => {
          // Use weighted attendance calculation (Option 3)
          // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
          const weightedAttendance = (data.present * 1.0) + (data.late * 0.5) + (data.excused * 0.75) + (data.absent * 0.0)
          
          return {
            studentName: data.studentName,
            studentEmail: data.studentEmail,
            attendanceRate: data.total > 0 ? (weightedAttendance / data.total) * 100 : 0,
            presentSessions: data.present
          }
        })
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .slice(0, 5)

      // Calculate quiz performance for this class
      const classQuizAttempts = classItem.quizzes.flatMap(quiz => quiz.attempts)
      const quizScoresByStudent = new Map<string, { scores: number[], attempts: number, studentName: string, studentEmail: string }>()
      
      classQuizAttempts.forEach(attempt => {
        const key = attempt.studentId
        const current = quizScoresByStudent.get(key) || { scores: [], attempts: 0, studentName: '', studentEmail: '' }
        current.scores.push(attempt.score || 0)
        current.attempts++
        quizScoresByStudent.set(key, current)
      })

      // Get student names for quiz attempts
      const studentIds = Array.from(quizScoresByStudent.keys())
      const students = await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, email: true }
      })

      students.forEach(student => {
        const data = quizScoresByStudent.get(student.id)
        if (data) {
          data.studentName = student.name
          data.studentEmail = student.email
        }
      })

      const topQuizPerformers = Array.from(quizScoresByStudent.entries())
        .map(([studentId, data]) => ({
          studentName: data.studentName,
          studentEmail: data.studentEmail,
          averageScore: data.scores.length > 0 ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length : 0,
          attemptsCount: data.attempts
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5)

      // Calculate assignment performance for this class
      const classAssignmentSubmissions = classItem.assignments.flatMap(assignment => assignment.submissions)
      const assignmentGradesByStudent = new Map<string, { grades: number[], submissions: number, studentName: string, studentEmail: string }>()
      
      classAssignmentSubmissions.forEach(submission => {
        const key = submission.studentId
        const current = assignmentGradesByStudent.get(key) || { grades: [], submissions: 0, studentName: '', studentEmail: '' }
        if (submission.grade) {
          current.grades.push(submission.grade)
        }
        current.submissions++
        assignmentGradesByStudent.set(key, current)
      })

      // Get student names for assignment submissions
      const assignmentStudentIds = Array.from(assignmentGradesByStudent.keys())
      const assignmentStudents = await prisma.user.findMany({
        where: { id: { in: assignmentStudentIds } },
        select: { id: true, name: true, email: true }
      })

      assignmentStudents.forEach(student => {
        const data = assignmentGradesByStudent.get(student.id)
        if (data) {
          data.studentName = student.name
          data.studentEmail = student.email
        }
      })

      const topAssignmentPerformers = Array.from(assignmentGradesByStudent.entries())
        .map(([studentId, data]) => ({
          studentName: data.studentName,
          studentEmail: data.studentEmail,
          averageGrade: data.grades.length > 0 ? data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length : 0,
          submissionsCount: data.submissions
        }))
        .sort((a, b) => b.averageGrade - a.averageGrade)
        .slice(0, 5)

      // Calculate overall performance metrics
      const classQuizScores = Array.from(quizScoresByStudent.values()).flatMap(data => data.scores)
      const classAssignmentGrades = Array.from(assignmentGradesByStudent.values()).flatMap(data => data.grades)
      const classAverageGrade = [...classQuizScores, ...classAssignmentGrades].length > 0 
        ? [...classQuizScores, ...classAssignmentGrades].reduce((sum, grade) => sum + grade, 0) / [...classQuizScores, ...classAssignmentGrades].length
        : 0

      const classCompletionRate = classItem.enrollments.length > 0 
        ? (Math.max(quizScoresByStudent.size, assignmentGradesByStudent.size) / classItem.enrollments.length) * 100
        : 0

      const classEngagementScore = classItem.enrollments.length > 0 
        ? ((quizScoresByStudent.size + assignmentGradesByStudent.size + attendanceByStudent.size) / (classItem.enrollments.length * 3)) * 100
        : 0

      return {
        classId: classItem.id,
        className: classItem.name,
        classCode: classItem.code,
        studentCount: classItem.enrollments.length,
        quizPerformance: {
          totalQuizzes: classItem.quizzes.length,
          totalAttempts: classQuizAttempts.length,
          averageScore: classQuizScores.length > 0 ? classQuizScores.reduce((sum, score) => sum + score, 0) / classQuizScores.length : 0,
          completionRate: classItem.enrollments.length > 0 ? (quizScoresByStudent.size / classItem.enrollments.length) * 100 : 0,
          topPerformers: topQuizPerformers
        },
        assignmentPerformance: {
          totalAssignments: classItem.assignments.length,
          totalSubmissions: classAssignmentSubmissions.length,
          averageGrade: classAssignmentGrades.length > 0 ? classAssignmentGrades.reduce((sum, grade) => sum + grade, 0) / classAssignmentGrades.length : 0,
          completionRate: classItem.enrollments.length > 0 ? (assignmentGradesByStudent.size / classItem.enrollments.length) * 100 : 0,
          topPerformers: topAssignmentPerformers
        },
        attendancePerformance: {
          totalSessions,
          averageAttendance,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          topAttendees
        },
        overallPerformance: {
          averageGrade: classAverageGrade,
          completionRate: classCompletionRate,
          engagementScore: classEngagementScore
        }
      }
    }))

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
      },
      classAnalytics
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
