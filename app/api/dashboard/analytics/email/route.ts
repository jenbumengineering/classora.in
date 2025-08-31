import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: 'server.dnspark.in',
  port: 465,
  secure: true,
  auth: {
    user: 'support@classora.in',
    pass: process.env.EMAIL_PASSWORD || 'Unbreakable@7001'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
  requireTLS: true,
  ignoreTLS: false
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

export async function POST(request: NextRequest) {
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

    const { email, professorName, includeCharts, dateRange } = await request.json()

    // Get professor's classes with all related data
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

    // Calculate analytics (similar to the main analytics API)
    const allEnrollments = classes.flatMap(classItem => classItem.enrollments)
    const uniqueStudentIds = new Set(allEnrollments.map(enrollment => enrollment.student.id))
    const totalStudents = uniqueStudentIds.size
    const totalClasses = classes.length

    const allQuizAttempts = classes.flatMap(classItem => 
      classItem.quizzes.flatMap(quiz => quiz.attempts)
    )

    const allAssignmentSubmissions = classes.flatMap(classItem => 
      classItem.assignments.flatMap(assignment => assignment.submissions)
    )

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

    const totalAssignments = classes.reduce((sum, classItem) => 
      sum + classItem.assignments.length, 0
    )
    
    const studentsWithSubmissions = new Set(allAssignmentSubmissions.map(submission => submission.studentId))
    const completionRate = totalStudents > 0 
      ? Math.round((studentsWithSubmissions.size / totalStudents) * 100)
      : 0

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

    const totalNotes = classes.reduce((sum, classItem) => 
      sum + classItem.notes.length, 0
    )

    const totalQuizzes = classes.reduce((sum, classItem) => 
      sum + classItem.quizzes.length, 0
    )

    // Generate monthly stats
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

    const totalQuizAttempts = allQuizAttempts.length
    const successfulQuizAttempts = allQuizAttempts.filter(attempt => 
      attempt.score && attempt.score >= 70
    ).length

    const studentEngagement = totalStudents > 0 
      ? Math.round((activeStudents / totalStudents) * 100)
      : 0

    const successfulBestScores = bestQuizScores.filter(score => score >= 70).length
    const quizPerformance = bestQuizScores.length > 0 
      ? Math.round((successfulBestScores / bestQuizScores.length) * 100)
      : 0

    const totalContent = totalNotes + totalQuizzes + totalAssignments
    const contentConsumption = totalStudents > 0 
      ? Math.round(totalContent / totalStudents)
      : 0

    // Generate class analytics
    const classAnalytics = await Promise.all(classes.map(async (classItem) => {
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

      const allAttendanceRecords = attendanceSessions.flatMap(session => session.records)
      const totalSessions = attendanceSessions.length
      const presentCount = allAttendanceRecords.filter(record => record.status === 'PRESENT').length
      const absentCount = allAttendanceRecords.filter(record => record.status === 'ABSENT').length
      const lateCount = allAttendanceRecords.filter(record => record.status === 'LATE').length
      const excusedCount = allAttendanceRecords.filter(record => record.status === 'EXCUSED').length
      const averageAttendance = totalSessions > 0 ? (presentCount / (presentCount + absentCount + lateCount + excusedCount)) * 100 : 0

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

      const classQuizAttempts = classItem.quizzes.flatMap(quiz => quiz.attempts)
      const quizScoresByStudent = new Map<string, { scores: number[], attempts: number, studentName: string, studentEmail: string }>()
      
      classQuizAttempts.forEach(attempt => {
        const key = attempt.studentId
        const current = quizScoresByStudent.get(key) || { scores: [], attempts: 0, studentName: '', studentEmail: '' }
        current.scores.push(attempt.score || 0)
        current.attempts++
        quizScoresByStudent.set(key, current)
      })

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

    // Generate beautiful email summary
    const emailSummary = generateEmailSummary({
      professorName: professorName || user.name,
      totalStudents,
      totalClasses,
      averageGrade,
      completionRate,
      performanceMetrics: {
        studentEngagement,
        assignmentCompletion: completionRate,
        quizPerformance,
        contentConsumption
      },
      classAnalytics
    })

    // Generate detailed HTML report for attachment
    const detailedReport = generateDetailedReport({
      professorName: professorName || user.name,
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

    // Send email with HTML report attachment
    const mailOptions = {
      from: 'support@classora.in',
      to: email,
      subject: `Analytics Report - ${professorName || user.name} - ${new Date().toLocaleDateString()}`,
      html: emailSummary,
      attachments: [
        {
          filename: `analytics-report-${new Date().toISOString().split('T')[0]}.html`,
          content: detailedReport,
          contentType: 'text/html'
        }
      ]
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error sending analytics email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateEmailSummary(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Performance Analytics Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1f2937;
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          color: #6b7280;
          margin: 0;
          font-size: 16px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }
        .summary-card .value {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }
        .summary-card.completion-rate {
          grid-column: 1;
          grid-row: 2;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .metric-card {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }
        .metric-card .label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .metric-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        .class-section {
          margin-bottom: 30px;
        }
        .class-section h2 {
          color: #1f2937;
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 700;
        }
        .attachment-notice {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 2px solid #3b82f6;
          border-radius: 10px;
          padding: 25px;
          text-align: center;
          margin-top: 30px;
        }
        .attachment-notice h3 {
          color: #1e40af;
          margin: 0 0 15px 0;
          font-size: 20px;
          font-weight: 600;
        }
        .attachment-notice p {
          color: #1e40af;
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 25px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .container {
            padding: 20px;
          }
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .summary-card.completion-rate {
            grid-column: auto;
            grid-row: auto;
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
      <div class="header">
          <h1>Student Performance Analytics Report</h1>
          <p>Generated for ${data.professorName} on ${new Date().toLocaleDateString()}</p>
      </div>
      
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Students</h3>
            <div class="value">${data.totalStudents}</div>
          </div>
          <div class="summary-card">
            <h3>Total Classes</h3>
            <div class="value">${data.totalClasses}</div>
          </div>
          <div class="summary-card">
            <h3>Average Grade</h3>
            <div class="value">${data.averageGrade.toFixed(1)}%</div>
          </div>
          <div class="summary-card completion-rate">
            <h3>Completion Rate</h3>
            <div class="value">${data.completionRate.toFixed(1)}%</div>
          </div>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">Student Engagement</div>
            <div class="value">${data.performanceMetrics.studentEngagement.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Assignment Completion</div>
            <div class="value">${data.performanceMetrics.assignmentCompletion.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Quiz Performance</div>
            <div class="value">${data.performanceMetrics.quizPerformance.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Content Consumption</div>
            <div class="value">${data.performanceMetrics.contentConsumption.toFixed(1)}</div>
          </div>
        </div>
        
        <div class="class-section">
          <h2>Class Performance Analytics</h2>
        </div>
        
        <div class="attachment-notice">
          <h3>📎 Detailed Report Attached</h3>
          <p>Find the complete analytics report with detailed charts, trends, and comprehensive data analysis attached to this email as an HTML document.</p>
        </div>
        
        <div class="footer">
          <p>This report was generated automatically by Classora.in Analytics System</p>
          <p>For questions or support, please contact our team.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateDetailedReport(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Analytics Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1f2937;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          color: #6b7280;
          margin: 0;
          font-size: 16px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .summary-card .value {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .metric-card {
          background-color: #f8f9fa;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }
        .metric-card .label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .metric-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        .class-section {
          margin-bottom: 30px;
        }
        .class-section h2 {
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .class-card {
          background-color: #f8f9fa;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .class-header {
          margin-bottom: 15px;
        }
        .class-header h3 {
          color: #1f2937;
          margin: 0 0 5px 0;
          font-size: 18px;
        }
        .class-header p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }
        .performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        .performance-card {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
        }
        .performance-card h4 {
          color: #1f2937;
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .performance-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .performance-item .label {
          color: #6b7280;
        }
        .performance-item .value {
          font-weight: 600;
          color: #1f2937;
        }
        .top-performers {
          margin-top: 10px;
        }
        .top-performers h5 {
          color: #1f2937;
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
        }
        .performer-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 3px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .container {
            padding: 20px;
          }
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Student Performance Analytics Report</h1>
          <p>Generated for ${data.professorName} on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Students</h3>
            <div class="value">${data.totalStudents}</div>
          </div>
          <div class="summary-card">
            <h3>Total Classes</h3>
            <div class="value">${data.totalClasses}</div>
          </div>
          <div class="summary-card">
            <h3>Average Grade</h3>
            <div class="value">${data.averageGrade.toFixed(1)}%</div>
          </div>
          <div class="summary-card">
            <h3>Completion Rate</h3>
            <div class="value">${data.completionRate.toFixed(1)}%</div>
          </div>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">Student Engagement</div>
            <div class="value">${data.performanceMetrics.studentEngagement.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Assignment Completion</div>
            <div class="value">${data.performanceMetrics.assignmentCompletion.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Quiz Performance</div>
            <div class="value">${data.performanceMetrics.quizPerformance.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Content Consumption</div>
            <div class="value">${data.performanceMetrics.contentConsumption.toFixed(1)}</div>
          </div>
        </div>
        
        <div class="class-section">
          <h2>Class Performance Analytics</h2>
          ${data.classAnalytics.map((classItem: any) => `
            <div class="class-card">
              <div class="class-header">
                <h3>${classItem.className}</h3>
                <p>Total Students: ${classItem.totalStudents}</p>
              </div>
              <div class="performance-grid">
                <div class="performance-card">
                  <h4>Quiz Performance</h4>
                  <div class="performance-item">
                    <span class="label">Average Score:</span>
                    <span class="value">${classItem.quizPerformance.averageScore.toFixed(1)}%</span>
                  </div>
                  <div class="performance-item">
                    <span class="label">Completion Rate:</span>
                    <span class="value">${classItem.quizPerformance.completionRate.toFixed(1)}%</span>
                  </div>
                  <div class="performance-item">
                    <span class="label">Total Attempts:</span>
                    <span class="value">${classItem.quizPerformance.totalAttempts}</span>
                  </div>
                  ${classItem.quizPerformance.topPerformers.length > 0 ? `
                    <div class="top-performers">
                      <h5>Top Performers:</h5>
                      ${classItem.quizPerformance.topPerformers.map((performer: any, index: number) => `
                        <div class="performer-item">
                          <span>${index + 1}. ${performer.name}</span>
                          <span>${performer.averageScore.toFixed(1)}%</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>

                <div class="performance-card">
                  <h4>Assignment Performance</h4>
                  <div class="performance-item">
                    <span class="label">Average Grade:</span>
                    <span class="value">${classItem.assignmentPerformance.averageGrade.toFixed(1)}%</span>
                  </div>
                  <div class="performance-item">
                    <span class="label">Completion Rate:</span>
                    <span class="value">${classItem.assignmentPerformance.completionRate.toFixed(1)}%</span>
                  </div>
                  <div class="performance-item">
                    <span class="label">Total Submissions:</span>
                    <span class="value">${classItem.assignmentPerformance.totalSubmissions}</span>
                  </div>
                  ${classItem.assignmentPerformance.topPerformers.length > 0 ? `
                    <div class="top-performers">
                      <h5>Top Performers:</h5>
                      ${classItem.assignmentPerformance.topPerformers.map((performer: any, index: number) => `
                        <div class="performer-item">
                          <span>${index + 1}. ${performer.name}</span>
                          <span>${performer.averageGrade.toFixed(1)}%</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>

                <div class="performance-card">
                  <h4>Attendance Performance</h4>
                  <div class="performance-item">
                    <span class="label">Average Attendance:</span>
                    <span class="value">${classItem.attendancePerformance.averageAttendance.toFixed(1)}%</span>
                  </div>
                  <div class="performance-item">
                    <span class="label">Present Sessions:</span>
                    <span class="value">${classItem.attendancePerformance.presentCount}</span>
                  </div>
                  <div class="performance-item">
                    <span class="label">Total Sessions:</span>
                    <span class="value">${classItem.attendancePerformance.totalSessions}</span>
                  </div>
                  ${classItem.attendancePerformance.topAttendees.length > 0 ? `
                    <div class="top-performers">
                      <h5>Top Attendees:</h5>
                      ${classItem.attendancePerformance.topAttendees.map((attendee: any, index: number) => `
                        <div class="performer-item">
                          <span>${index + 1}. ${attendee.name}</span>
                          <span>${attendee.attendanceRate.toFixed(1)}%</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
      </div>
      
      <div class="footer">
          <p>This report was generated automatically by Classora.in Analytics System</p>
          <p>For questions or support, please contact our team.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
