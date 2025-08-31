import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    // Get student information
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get enrolled classes
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    const classes = enrollments.map(enrollment => enrollment.class)

    // Get quiz performance
    let quizPerformance = []
    let subjectQuizStats = []
    try {
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: {
            include: {
              class: {
                select: {
                  name: true,
                  code: true
                }
              },
              questions: {
                select: {
                  points: true
                }
              }
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      })

      // Group quiz attempts by quiz and get best score
      const quizPerformanceMap = new Map()
      const subjectQuizStatsMap = new Map()
      const quizMaxScores = new Map() // Store max score per quiz
      
      // First pass: calculate max score for each quiz
      quizAttempts.forEach(attempt => {
        const quizId = attempt.quizId
        if (!quizMaxScores.has(quizId)) {
          const maxScore = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0)
          quizMaxScores.set(quizId, maxScore)
        }
      })
      
      // Second pass: process attempts with correct max scores
      quizAttempts.forEach(attempt => {
        const quizId = attempt.quizId
        const className = attempt.quiz.class.name
        const classCode = attempt.quiz.class.code
        const maxScore = quizMaxScores.get(quizId)
        
        if (!quizPerformanceMap.has(quizId)) {
          quizPerformanceMap.set(quizId, {
            quizId,
            quizTitle: attempt.quiz.title,
            className,
            classCode,
            score: attempt.score || 0,
            maxScore,
            attempts: 1,
            lastAttemptDate: attempt.startedAt.toISOString()
          })
        } else {
          const existing = quizPerformanceMap.get(quizId)
          if ((attempt.score || 0) > existing.score) {
            existing.score = attempt.score || 0
          }
          existing.attempts++
          if (attempt.startedAt > new Date(existing.lastAttemptDate)) {
            existing.lastAttemptDate = attempt.startedAt.toISOString()
          }
        }
        
        // Group by subject for subject-wise statistics
        if (!subjectQuizStatsMap.has(className)) {
          subjectQuizStatsMap.set(className, {
            className,
            classCode,
            totalQuizzes: 1,
            totalAttempts: 1,
            bestScores: [{
              score: attempt.score || 0,
              maxScore: maxScore
            }],
            quizIds: new Set([quizId])
          })
        } else {
          const existing = subjectQuizStatsMap.get(className)
          // Only increment totalQuizzes if this is a new quiz
          if (!existing.quizIds.has(quizId)) {
            existing.totalQuizzes++
            existing.bestScores.push({
              score: attempt.score || 0,
              maxScore: maxScore
            })
            existing.quizIds.add(quizId)
          } else {
            // Update best score for this quiz if current attempt is better
            const quizIndex = Array.from(existing.quizIds).indexOf(quizId)
            if (quizIndex >= 0 && (attempt.score || 0) > existing.bestScores[quizIndex].score) {
              existing.bestScores[quizIndex].score = attempt.score || 0
            }
          }
          existing.totalAttempts++
        }
      })

      quizPerformance = Array.from(quizPerformanceMap.values())
      subjectQuizStats = Array.from(subjectQuizStatsMap.values()).map(subject => {
        // Calculate average percentage based on best scores per quiz
        const quizPercentages = subject.bestScores.map(quiz => 
          quiz.maxScore > 0 ? Math.min((quiz.score / quiz.maxScore) * 100, 100) : 0
        )
        const avgPercentage = quizPercentages.length > 0 ? 
          quizPercentages.reduce((sum, percentage) => sum + percentage, 0) / quizPercentages.length : 0
        const totalBestScore = subject.bestScores.reduce((sum, quiz) => sum + quiz.score, 0)
        const totalMaxScore = subject.bestScores.reduce((sum, quiz) => sum + quiz.maxScore, 0)
        const averageScore = subject.totalAttempts > 0 ? totalBestScore / subject.totalAttempts : 0
        
        const { quizIds, bestScores, ...subjectData } = subject
        return {
          ...subjectData,
          totalScore: totalBestScore,
          totalMaxScore: totalMaxScore,
          averageScore: Math.round(averageScore * 100) / 100,
          averagePercentage: Math.round(avgPercentage * 100) / 100
        }
      })
      console.log('Subject quiz stats calculated:', subjectQuizStats.length, 'subjects')
    } catch (error) {
      console.error('Error fetching quiz performance:', error)
      subjectQuizStats = []
    }

    // Get assignment submissions
    let submissions = []
    try {
      const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
        where: { studentId },
        include: {
          assignment: {
            include: {
              class: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      })

      submissions = assignmentSubmissions.map(submission => ({
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment.title,
        className: submission.assignment.class.name,
        grade: submission.grade,
        maxGrade: submission.maxGrade || 100,
        submittedAt: submission.submittedAt.toISOString(),
        status: submission.grade !== null ? 'graded' : 'submitted'
      }))
    } catch (error) {
      console.error('Error fetching assignment submissions:', error)
    }

    // Get attendance records
    let attendance = []
    let subjectAttendanceStats = []
    try {
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: { studentId },
        include: {
          session: {
            include: {
              class: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { session: { date: 'desc' } }
      })

      attendance = attendanceRecords.map(record => ({
        date: record.session.date.toISOString(),
        status: record.status,
        className: record.session.class.name,
        reason: record.notes
      }))

      // Calculate subject-wise attendance statistics with weighted attendance
      subjectAttendanceStats = classes.map(classItem => {
        const classAttendance = attendance.filter(record => record.className === classItem.name)
        const present = classAttendance.filter(record => record.status === 'PRESENT').length
        const absent = classAttendance.filter(record => record.status === 'ABSENT').length
        const late = classAttendance.filter(record => record.status === 'LATE').length
        const excused = classAttendance.filter(record => record.status === 'EXCUSED').length
        const total = classAttendance.length
        
        // Weighted attendance calculation (Option 3)
        // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
        const weightedAttendance = (present * 1.0) + (late * 0.5) + (excused * 0.75) + (absent * 0.0)
        const attendanceRate = total > 0 ? (weightedAttendance / total) * 100 : 0

        return {
          className: classItem.name,
          classCode: classItem.code,
          present,
          absent,
          late,
          excused,
          total,
          attendanceRate
        }
      })
    } catch (error) {
      console.error('Error fetching attendance records:', error)
    }

    // Calculate completion rate based on total assigned items vs unique completed items
    let totalAssignedQuizzes = 0
    let totalAssignedAssignments = 0
    let uniqueCompletedQuizzes = 0
    let uniqueCompletedAssignments = 0
    
    try {
      // Count total assigned quizzes and assignments
      totalAssignedQuizzes = await prisma.quiz.count({
        where: {
          class: {
            enrollments: {
              some: {
                studentId: studentId
              }
            }
          }
        }
      })

      totalAssignedAssignments = await prisma.assignment.count({
        where: {
          class: {
            enrollments: {
              some: {
                studentId: studentId
              }
            }
          }
        }
      })

      // Count unique completed quizzes (not attempts)
      const uniqueQuizAttempts = await prisma.quizAttempt.groupBy({
        by: ['quizId'],
        where: { studentId }
      })
      uniqueCompletedQuizzes = uniqueQuizAttempts.length

      // Count unique completed assignments (not submissions)
      const uniqueAssignmentSubmissions = await prisma.assignmentSubmission.groupBy({
        by: ['assignmentId'],
        where: { studentId }
      })
      uniqueCompletedAssignments = uniqueAssignmentSubmissions.length
      
    } catch (error) {
      console.error('Error calculating completion rate:', error)
    }

    const totalAssignedItems = totalAssignedQuizzes + totalAssignedAssignments
    const completedItems = uniqueCompletedQuizzes + uniqueCompletedAssignments
    const completionRate = totalAssignedItems > 0 ? (completedItems / totalAssignedItems) * 100 : 0

    // Calculate overall stats
    const totalClasses = classes.length
    const totalQuizzes = uniqueCompletedQuizzes
    const totalAssignments = uniqueCompletedAssignments
    const totalAttendanceSessions = attendance.length

    const averageQuizScore = subjectQuizStats.length > 0 
      ? subjectQuizStats.reduce((sum, subject) => sum + subject.averagePercentage, 0) / subjectQuizStats.length
      : 0

    const gradedSubmissions = submissions.filter(s => s.grade !== null)
    const averageAssignmentGrade = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, sub) => sum + (sub.grade! / sub.maxGrade * 100), 0) / gradedSubmissions.length
      : 0

    // Calculate overall attendance rate using weighted attendance (Option 3)
    const present = attendance.filter(a => a.status === 'PRESENT').length
    const absent = attendance.filter(a => a.status === 'ABSENT').length
    const late = attendance.filter(a => a.status === 'LATE').length
    const excused = attendance.filter(a => a.status === 'EXCUSED').length
    const total = attendance.length
    
    // Weighted attendance calculation (Option 3)
    // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
    const weightedAttendance = (present * 1.0) + (late * 0.5) + (excused * 0.75) + (absent * 0.0)
    const attendanceRate = total > 0 ? (weightedAttendance / total) * 100 : 0

    const overallStats = {
      totalClasses,
      totalQuizzes,
      totalAssignments,
      totalAttendanceSessions,
      averageQuizScore,
      averageAssignmentGrade,
      attendanceRate,
      completionRate
    }

    return NextResponse.json({
      student,
      classes,
      quizPerformance,
      assignmentSubmissions: submissions,
      attendanceRecords: attendance,
      subjectAttendanceStats,
      subjectQuizStats,
      overallStats
    })

  } catch (error) {
    console.error('Error fetching student analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
