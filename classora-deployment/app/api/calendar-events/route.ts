import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['holiday', 'academic', 'todo']),
  date: z.string().min(1, 'Date is required'),
  classId: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
})

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

    const body = await request.json()
    const validatedData = createCalendarEventSchema.parse(body)

    // Verify class exists and belongs to professor (if classId is provided)
    if (validatedData.classId) {
      const classData = await prisma.class.findUnique({
        where: { id: validatedData.classId, professorId: userId }
      })
      if (!classData) {
        return NextResponse.json(
          { error: 'Class not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        type: validatedData.type,
        date: new Date(validatedData.date),
        classId: validatedData.classId || null,
        category: validatedData.category || null,
        priority: validatedData.priority || null,
        professorId: userId,
      },
      include: {
        class: true
      }
    })

    return NextResponse.json(event, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let events: any[] = []

    if (user.role === 'PROFESSOR') {
      // For professors, get their own events
      events = await prisma.calendarEvent.findMany({
        where: { professorId: userId },
        include: {
          class: true
        },
        orderBy: { date: 'asc' }
      })
    } else if (user.role === 'STUDENT') {
      // For students, get events from their enrolled classes
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        include: {
          class: {
            include: {
              calendarEvents: true
            }
          }
        }
      })

      events = enrollments.flatMap(enrollment => 
        enrollment.class.calendarEvents.map(event => ({
          ...event,
          class: enrollment.class
        }))
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    return NextResponse.json({ events })

  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
