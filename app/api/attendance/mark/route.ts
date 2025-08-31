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

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, studentId, status, notes } = body

    if (!sessionId || !studentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify professor owns the session
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, professorId: user.id },
      include: { class: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 })
    }

    // Verify student is enrolled in the class
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_classId: { studentId, classId: session.classId } }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 400 })
    }

    // Mark attendance (upsert to handle updates)
    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: { sessionId, studentId }
      },
      update: {
        status,
        notes,
        markedAt: new Date()
      },
      create: {
        sessionId,
        studentId,
        status,
        notes,
        markedBy: user.id
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, records } = body

    if (!sessionId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify professor owns the session
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, professorId: user.id }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 })
    }

    // Batch update attendance records
    const updatedRecords = []
    for (const record of records) {
      const { studentId, status, notes } = record

      // Verify student is enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId, classId: session.classId } }
      })

      if (!enrollment) {
        continue // Skip if not enrolled
      }

      const updatedRecord = await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: { sessionId, studentId }
        },
        update: {
          status,
          notes,
          markedAt: new Date()
        },
        create: {
          sessionId,
          studentId,
          status,
          notes,
          markedBy: user.id
        },
        include: {
          student: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      updatedRecords.push(updatedRecord)
    }

    return NextResponse.json({ records: updatedRecords })
  } catch (error) {
    console.error('Error batch marking attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
