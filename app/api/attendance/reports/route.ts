import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const period = searchParams.get('period') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeNotMarked = searchParams.get('includeNotMarked') === 'true'
    const professorId = request.headers.get('x-user-id')

    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      )
    }

    // Verify user is a professor and owns the class
    const user = await prisma.user.findUnique({
      where: { id: professorId }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json(
        { error: 'Access denied. Professor role required.' },
        { status: 403 }
      )
    }

    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        professorId: professorId
      }
    })

    if (!classExists) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate date range based on period
    let start: Date
    let end: Date = new Date()

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      switch (period) {
        case 'daily':
          start = new Date()
          start.setHours(0, 0, 0, 0)
          end = new Date()
          end.setHours(23, 59, 59, 999)
          break
        case 'weekly':
          start = new Date()
          start.setDate(start.getDate() - 7)
          break
        case 'monthly':
        default:
          start = new Date()
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          break
      }
    }

    // Get all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Get attendance sessions in the date range
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId,
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        records: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Generate reports for each student
    const reports = enrollments.map(enrollment => {
      const studentId = enrollment.student.id
      const studentRecords = sessions.flatMap(session => 
        session.records.filter(record => record.studentId === studentId)
      )

      const present = studentRecords.filter(r => r.status === 'PRESENT').length
      const absent = studentRecords.filter(r => r.status === 'ABSENT').length
      const late = studentRecords.filter(r => r.status === 'LATE').length
      const excused = studentRecords.filter(r => r.status === 'EXCUSED').length
      const notMarked = sessions.length - studentRecords.length

      const totalSessions = includeNotMarked ? sessions.length : studentRecords.length
      // Use weighted attendance calculation (Option 3)
      // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
      const weightedAttendance = (present * 1.0) + (late * 0.5) + (excused * 0.75) + (absent * 0.0)
      const attendanceRate = totalSessions > 0 
        ? (weightedAttendance / totalSessions) * 100
        : 0

      // Get detailed session information
      const sessionDetails = sessions.map(session => {
        const record = session.records.find(r => r.studentId === studentId)
        return {
          date: session.date.toISOString().split('T')[0],
          title: session.title || undefined,
          status: record ? record.status : 'NOT_MARKED'
        }
      })

      return {
        studentId: enrollment.student.id,
        studentName: enrollment.student.name,
        studentEmail: enrollment.student.email,
        totalSessions,
        present,
        absent,
        late,
        excused,
        notMarked: includeNotMarked ? notMarked : 0,
        attendanceRate,
        sessions: sessionDetails
      }
    })

    // Sort by attendance rate (descending)
    reports.sort((a, b) => b.attendanceRate - a.attendanceRate)

    return NextResponse.json({
      reports,
      summary: {
        totalStudents: reports.length,
        averageAttendanceRate: reports.length > 0 
          ? reports.reduce((sum, report) => sum + report.attendanceRate, 0) / reports.length
          : 0,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        }
      }
    })

  } catch (error) {
    console.error('Error generating attendance reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
