import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { format = 'pdf', includeCharts = true, dateRange = 'last30days' } = body

    // Get analytics data
    let analyticsData = {}
    
    if (user.role === 'PROFESSOR') {
      // Professor analytics
      const classes = await prisma.class.findMany({
        where: { professorId: user.id },
        include: {
          enrollments: {
            include: {
              student: true
            }
          },
          assignments: true,
          quizzes: true,
          notes: true
        }
      })

      const totalStudents = classes.reduce((sum, cls) => sum + cls.enrollments.length, 0)
      const totalAssignments = classes.reduce((sum, cls) => sum + cls.assignments.length, 0)
      const totalQuizzes = classes.reduce((sum, cls) => sum + cls.quizzes.length, 0)
      const totalNotes = classes.reduce((sum, cls) => sum + cls.notes.length, 0)

      analyticsData = {
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        summary: {
          totalClasses: classes.length,
          totalStudents,
          totalAssignments,
          totalQuizzes,
          totalNotes,
          reportDate: new Date().toISOString(),
          dateRange
        },
        classes: classes.map(cls => ({
          name: cls.name,
          code: cls.code,
          studentCount: cls.enrollments.length,
          assignmentCount: cls.assignments.length,
          quizCount: cls.quizzes.length,
          noteCount: cls.notes.length
        }))
      }
    } else {
      // Student analytics
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        include: {
          class: {
            include: {
              assignments: true,
              quizzes: true,
              notes: {
                where: { status: 'PUBLISHED' }
              }
            }
          }
        }
      })

      const totalClasses = enrollments.length
      const totalAssignments = enrollments.reduce((sum, enrollment) => 
        sum + enrollment.class.assignments.length, 0)
      const totalQuizzes = enrollments.reduce((sum, enrollment) => 
        sum + enrollment.class.quizzes.length, 0)
      const totalNotes = enrollments.reduce((sum, enrollment) => 
        sum + enrollment.class.notes.length, 0)

      analyticsData = {
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        summary: {
          totalClasses,
          totalAssignments,
          totalQuizzes,
          totalNotes,
          reportDate: new Date().toISOString(),
          dateRange
        },
        enrollments: enrollments.map(enrollment => ({
          className: enrollment.class.name,
          classCode: enrollment.class.code,
          assignmentCount: enrollment.class.assignments.length,
          quizCount: enrollment.class.quizzes.length,
          noteCount: enrollment.class.notes.length
        }))
      }
    }

    // For now, return JSON data that can be converted to PDF on the client side
    // In a production environment, you would use a library like puppeteer or jsPDF
    // to generate actual PDF files
    
    const reportData = {
      title: `${user.role === 'PROFESSOR' ? 'Teaching' : 'Learning'} Analytics Report`,
      generatedAt: new Date().toISOString(),
      data: analyticsData
    }

    // Return as JSON for now - in production, generate actual PDF
    return NextResponse.json({
      success: true,
      message: 'Analytics report generated successfully',
      data: reportData
    })

  } catch (error) {
    console.error('Error generating analytics report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
