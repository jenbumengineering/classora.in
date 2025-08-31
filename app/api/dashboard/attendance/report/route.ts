import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'custom'

    if (!classId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        professor: {
          select: {
            name: true
          }
        }
      }
    })

    if (!classInfo) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get attendance sessions within date range
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
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

    const students = enrollments.map(enrollment => enrollment.student)

    // Calculate student statistics
    const studentStats = students.map(student => {
      const studentRecords = sessions.flatMap(session => 
        session.records.filter(record => record.studentId === student.id)
      )

      const present = studentRecords.filter(record => record.status === 'PRESENT').length
      const absent = studentRecords.filter(record => record.status === 'ABSENT').length
      const late = studentRecords.filter(record => record.status === 'LATE').length
      const excused = studentRecords.filter(record => record.status === 'EXCUSED').length
      const totalSessions = sessions.length
      const notMarked = totalSessions - (present + absent + late + excused)
      
      // Use weighted attendance calculation (Option 3) - same as Student Performance Report
      // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
      const weightedAttendance = (present * 1.0) + (late * 0.5) + (excused * 0.75) + (absent * 0.0)
      const attendanceRate = totalSessions > 0 ? (weightedAttendance / totalSessions) * 100 : 0

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        totalSessions,
        present,
        absent,
        late,
        excused,
        notMarked,
        attendanceRate
      }
    })

    // Calculate daily statistics
    const dailyStats = sessions.map(session => {
      const records = session.records
      const present = records.filter(record => record.status === 'PRESENT').length
      const absent = records.filter(record => record.status === 'ABSENT').length
      const late = records.filter(record => record.status === 'LATE').length
      const excused = records.filter(record => record.status === 'EXCUSED').length
      const total = records.length

      return {
        date: session.date.toISOString(),
        present,
        absent,
        late,
        excused,
        total
      }
    })

    // Calculate overall statistics
    const totalSessions = sessions.length
    const totalPresent = studentStats.reduce((sum, student) => sum + student.present, 0)
    const totalAbsent = studentStats.reduce((sum, student) => sum + student.absent, 0)
    const totalLate = studentStats.reduce((sum, student) => sum + student.late, 0)
    const totalExcused = studentStats.reduce((sum, student) => sum + student.excused, 0)
    const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused
    
    // Calculate average of individual student attendance rates
    const averageAttendance = studentStats.length > 0 
      ? studentStats.reduce((sum, student) => sum + student.attendanceRate, 0) / studentStats.length 
      : 0

    const report = {
      classId: classInfo.id,
      className: classInfo.name,
      classCode: classInfo.code,
              teacherName: classInfo.professor.name,
      dateRange: {
        start: startDate,
        end: endDate
      },
      period,
      totalStudents: students.length,
      totalSessions,
      averageAttendance,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      studentStats: studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate),
      dailyStats
    }

    return NextResponse.json(report)

  } catch (error) {
    console.error('Error generating attendance report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
