import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const period = searchParams.get('period') || '30' // days

    if (!classId) {
      return NextResponse.json({ error: 'Missing classId parameter' }, { status: 400 })
    }

    // Check access permissions
    if (user.role === 'PROFESSOR') {
      const classData = await prisma.class.findFirst({
        where: { id: classId, professorId: user.id }
      })
      if (!classData) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId: user.id, classId } }
      })
      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    if (user.role === 'PROFESSOR') {
      // Check if requesting specific student data
      if (studentId) {
        // Professor requesting specific student attendance
        const sessions = await prisma.attendanceSession.findMany({
          where: {
            classId,
            professorId: user.id,
            date: { gte: daysAgo }
          },
          include: {
            records: {
              where: { studentId: studentId }
            }
          },
          orderBy: { date: 'desc' }
        })

        const totalSessions = sessions.length
        const present = sessions.filter(s => s.records[0]?.status === 'PRESENT').length
        const absent = sessions.filter(s => s.records[0]?.status === 'ABSENT').length
        const late = sessions.filter(s => s.records[0]?.status === 'LATE').length
        const excused = sessions.filter(s => s.records[0]?.status === 'EXCUSED').length
        const notMarked = sessions.filter(s => s.records.length === 0).length

        const analytics = {
          totalSessions,
          present,
          absent,
          late,
          excused,
          notMarked,
          attendanceRate: totalSessions > 0 
            ? (((present + late + excused) / totalSessions) * 100).toFixed(1)
            : '0',
          sessions: sessions.map(session => ({
            id: session.id,
            date: session.date,
            title: session.title,
            status: session.records[0]?.status || 'NOT_MARKED',
            markedAt: session.records[0]?.markedAt
          }))
        }

        return NextResponse.json({ analytics })
      } else {
        // Professor analytics - class overview
        const sessions = await prisma.attendanceSession.findMany({
          where: {
            classId,
            professorId: user.id,
            date: { gte: daysAgo }
          },
          include: {
            records: {
              include: {
                student: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          },
          orderBy: { date: 'desc' }
        })

        // Get all enrolled students
        const enrolledStudents = await prisma.enrollment.findMany({
          where: { classId },
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        })

        // Calculate statistics
        const totalSessions = sessions.length
        const totalStudents = enrolledStudents.length
        let totalPresent = 0
        let totalAbsent = 0
        let totalLate = 0
        let totalExcused = 0

        const studentStats = enrolledStudents.map(student => {
          const studentRecords = sessions.flatMap(session => 
            session.records.filter(record => record.studentId === student.student.id)
          )

          const present = studentRecords.filter(r => r.status === 'PRESENT').length
          const absent = studentRecords.filter(r => r.status === 'ABSENT').length
          const late = studentRecords.filter(r => r.status === 'LATE').length
          const excused = studentRecords.filter(r => r.status === 'EXCUSED').length
          const total = studentRecords.length

          totalPresent += present
          totalAbsent += absent
          totalLate += late
          totalExcused += excused

          // Use weighted attendance calculation (Option 3)
          // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
          const weightedAttendance = (present * 1.0) + (late * 0.5) + (excused * 0.75) + (absent * 0.0)
          
          return {
            student: student.student,
            present,
            absent,
            late,
            excused,
            total,
            attendanceRate: total > 0 ? (weightedAttendance / total * 100).toFixed(1) : '0'
          }
        })

        // Use weighted attendance calculation (Option 3) for overall rate
        // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
        const overallWeightedAttendance = (totalPresent * 1.0) + (totalLate * 0.5) + (totalExcused * 0.75) + (totalAbsent * 0.0)
        const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused
        
        const analytics = {
          totalSessions,
          totalStudents,
          totalPresent,
          totalAbsent,
          totalLate,
          totalExcused,
          overallAttendanceRate: totalRecords > 0 
            ? (overallWeightedAttendance / totalRecords * 100).toFixed(1)
            : '0',
          studentStats,
          sessions: sessions.map(session => ({
            id: session.id,
            date: session.date,
            title: session.title,
            totalRecords: session.records.length,
            present: session.records.filter(r => r.status === 'PRESENT').length,
            absent: session.records.filter(r => r.status === 'ABSENT').length,
            late: session.records.filter(r => r.status === 'LATE').length,
            excused: session.records.filter(r => r.status === 'EXCUSED').length
          }))
        }

        return NextResponse.json({ analytics })
      }
    } else {
      // Student analytics - personal attendance
      const sessions = await prisma.attendanceSession.findMany({
        where: {
          classId,
          date: { gte: daysAgo }
        },
        include: {
          records: {
            where: { studentId: user.id }
          }
        },
        orderBy: { date: 'desc' }
      })

      const totalSessions = sessions.length
      const present = sessions.filter(s => s.records[0]?.status === 'PRESENT').length
      const absent = sessions.filter(s => s.records[0]?.status === 'ABSENT').length
      const late = sessions.filter(s => s.records[0]?.status === 'LATE').length
      const excused = sessions.filter(s => s.records[0]?.status === 'EXCUSED').length
      const notMarked = sessions.filter(s => s.records.length === 0).length

      // Use weighted attendance calculation (Option 3)
      // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
      const weightedAttendance = (present * 1.0) + (late * 0.5) + (excused * 0.75) + (absent * 0.0)
      
      const analytics = {
        totalSessions,
        present,
        absent,
        late,
        excused,
        notMarked,
        attendanceRate: totalSessions > 0 
          ? (weightedAttendance / totalSessions * 100).toFixed(1)
          : '0',
        sessions: sessions.map(session => ({
          id: session.id,
          date: session.date,
          title: session.title,
          status: session.records[0]?.status || 'NOT_MARKED',
          markedAt: session.records[0]?.markedAt
        }))
      }

      return NextResponse.json({ analytics })
    }
  } catch (error) {
    console.error('Error fetching attendance analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
