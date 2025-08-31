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
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get specific session with records
      const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
          class: true,
          professor: {
            select: { id: true, name: true, email: true }
          },
          records: {
            include: {
              student: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: { records: true }
          }
        }
      })

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      // Check if user has access to this session
      if (user.role === 'STUDENT') {
        const isEnrolled = await prisma.enrollment.findUnique({
          where: { studentId_classId: { studentId: user.id, classId: session.classId } }
        })
        if (!isEnrolled) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      } else if (user.role === 'PROFESSOR' && session.professorId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      return NextResponse.json({ session })
    }

    if (classId) {
      // Get sessions for a specific class
      let sessions
      if (user.role === 'PROFESSOR') {
        sessions = await prisma.attendanceSession.findMany({
          where: { 
            classId,
            professorId: user.id
          },
          include: {
            class: true,
            _count: {
              select: { records: true }
            }
          },
          orderBy: { date: 'desc' }
        })
      } else {
        // Student view - only show sessions for enrolled classes
        const isEnrolled = await prisma.enrollment.findUnique({
          where: { studentId_classId: { studentId: user.id, classId } }
        })
        if (!isEnrolled) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        sessions = await prisma.attendanceSession.findMany({
          where: { classId },
          include: {
            class: true,
            professor: {
              select: { id: true, name: true }
            },
            records: {
              where: { studentId: user.id },
              select: { status: true, markedAt: true }
            }
          },
          orderBy: { date: 'desc' }
        })

        // Add _count for consistency with professor view
        const sessionsWithCount = await Promise.all(
          sessions.map(async (session) => {
            try {
              const count = await prisma.attendanceRecord.count({
                where: { sessionId: session.id }
              })
              return {
                ...session,
                _count: { records: count }
              }
            } catch (error) {
              console.error('Error counting records for session:', session.id, error)
              return {
                ...session,
                _count: { records: 0 }
              }
            }
          })
        )

        return NextResponse.json({ sessions: sessionsWithCount })
      }

      return NextResponse.json({ sessions: user.role === 'PROFESSOR' ? sessions : [] })
    }

    return NextResponse.json({ error: 'Missing classId or sessionId parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { classId, date, title, description } = body

    if (!classId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify professor owns the class
    const classData = await prisma.class.findFirst({
      where: { id: classId, professorId: user.id }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 })
    }

    // Create attendance session
    const session = await prisma.attendanceSession.create({
      data: {
        classId,
        professorId: user.id,
        date: new Date(date),
        title,
        description
      },
      include: {
        class: true,
        _count: {
          select: { records: true }
        }
      }
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
