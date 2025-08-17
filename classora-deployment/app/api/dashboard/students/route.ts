import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const professorId = request.headers.get('x-user-id')
    
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

    // Get all enrollments for professor's classes with student details
    const enrollments = await prisma.enrollment.findMany({
      where: {
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
            code: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Get unique students and their analytics
    const studentMap = new Map()
    
    for (const enrollment of enrollments) {
      const studentId = enrollment.student.id
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          name: enrollment.student.name,
          email: enrollment.student.email,
          enrolledClasses: 0,
          totalClasses: 0,
          averageGrade: 0,
          lastActive: enrollment.enrolledAt,
          classes: []
        })
      }
      
      const student = studentMap.get(studentId)
      student.enrolledClasses++
      student.classes.push({
        id: enrollment.class.id,
        name: enrollment.class.name,
        code: enrollment.class.code,
        enrolledAt: enrollment.enrolledAt
      })
    }

    // Get quiz attempts and assignment submissions for grade calculation
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          professorId: professorId
        }
      },
      select: {
        studentId: true,
        score: true,
        completedAt: true,
        startedAt: true
      }
    })

    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          professorId: professorId
        }
      },
      select: {
        studentId: true,
        grade: true,
        submittedAt: true
      }
    })

    // Calculate grades and activity for each student
    for (const student of Array.from(studentMap.values())) {
      const studentQuizAttempts = quizAttempts.filter(attempt => attempt.studentId === student.id)
      const studentSubmissions = assignmentSubmissions.filter(submission => submission.studentId === student.id)
      
      // Calculate average grade
      const grades = [
        ...studentQuizAttempts.map(attempt => attempt.score || 0),
        ...studentSubmissions.map(submission => submission.grade || 0)
      ].filter(grade => grade > 0)
      
      student.averageGrade = grades.length > 0 
        ? Math.round((grades.reduce((sum, grade) => sum + grade, 0) / grades.length) * 100) / 100
        : 0
      
      // Find last activity
      const lastQuizActivity = studentQuizAttempts.length > 0 
        ? Math.max(...studentQuizAttempts.map(attempt => new Date(attempt.completedAt || attempt.startedAt).getTime()))
        : 0
      
      const lastSubmissionActivity = studentSubmissions.length > 0
        ? Math.max(...studentSubmissions.map(submission => new Date(submission.submittedAt).getTime()))
        : 0
      
      const lastActivity = Math.max(lastQuizActivity, lastSubmissionActivity, new Date(student.lastActive).getTime())
      student.lastActive = new Date(lastActivity).toISOString()
    }

    // Convert to array and sort by last activity
    const students = Array.from(studentMap.values()).sort((a, b) => 
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    )

    return NextResponse.json({
      students,
      totalStudents: students.length,
      activeStudents: students.filter(student => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(student.lastActive) >= thirtyDaysAgo
      }).length
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
