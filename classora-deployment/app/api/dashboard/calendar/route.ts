import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const events = []

    if (user.role === 'PROFESSOR') {
      // For professors, get events from their classes
      const classes = await prisma.class.findMany({
        where: { professorId: userId },
        include: {
          assignments: true,
          quizzes: true,
          notes: true
        }
      })

      // Add assignments
      for (const classItem of classes) {
        for (const assignment of classItem.assignments) {
          if (assignment.dueDate) {
            events.push({
              id: assignment.id,
              title: assignment.title,
              type: 'assignment',
              date: assignment.dueDate.toISOString(),
              classId: classItem.id,
              className: classItem.name,
              description: assignment.description,
              status: assignment.status
            })
          }
        }

        // Add quizzes
        for (const quiz of classItem.quizzes) {
          events.push({
            id: quiz.id,
            title: quiz.title,
            type: 'quiz',
            date: quiz.createdAt.toISOString(),
            classId: classItem.id,
            className: classItem.name,
            description: quiz.description,
            status: quiz.status
          })
        }

        // Add notes (published dates)
        for (const note of classItem.notes) {
          if (note.status === 'PUBLISHED') {
            events.push({
              id: note.id,
              title: note.title,
              type: 'note',
              date: note.updatedAt.toISOString(),
              classId: classItem.id,
              className: classItem.name,
              description: 'Note published'
            })
          }
        }
      }

      // Add calendar events
      const calendarEvents = await prisma.calendarEvent.findMany({
        where: { professorId: userId },
        include: {
          class: true
        }
      })

      for (const event of calendarEvents) {
        events.push({
          id: event.id,
          title: event.title,
          type: event.type,
          date: event.date.toISOString(),
          classId: event.classId,
          className: event.class?.name || 'General',
          description: event.description,
          category: event.category,
          priority: event.priority
        })
      }

    } else if (user.role === 'STUDENT') {
      // For students, get events from enrolled classes
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        include: {
          class: {
            include: {
              assignments: true,
              quizzes: true,
              notes: {
                where: { status: 'PUBLISHED' }
              },
              calendarEvents: true
            }
          }
        }
      })

      // Add assignments
      for (const enrollment of enrollments) {
        for (const assignment of enrollment.class.assignments) {
          if (assignment.dueDate && assignment.status === 'PUBLISHED') {
            events.push({
              id: assignment.id,
              title: assignment.title,
              type: 'assignment',
              date: assignment.dueDate.toISOString(),
              classId: enrollment.class.id,
              className: enrollment.class.name,
              description: assignment.description,
              status: assignment.status
            })
          }
        }

        // Add quizzes
        for (const quiz of enrollment.class.quizzes) {
          if (quiz.status === 'PUBLISHED') {
            events.push({
              id: quiz.id,
              title: quiz.title,
              type: 'quiz',
              date: quiz.createdAt.toISOString(),
              classId: enrollment.class.id,
              className: enrollment.class.name,
              description: quiz.description,
              status: quiz.status
            })
          }
        }

        // Add published notes
        for (const note of enrollment.class.notes) {
          events.push({
            id: note.id,
            title: note.title,
            type: 'note',
            date: note.updatedAt.toISOString(),
            classId: enrollment.class.id,
            className: enrollment.class.name,
            description: 'Note published'
          })
        }

        // Add calendar events
        for (const event of enrollment.class.calendarEvents) {
          events.push({
            id: event.id,
            title: event.title,
            type: event.type,
            date: event.date.toISOString(),
            classId: enrollment.class.id,
            className: enrollment.class.name,
            description: event.description,
            category: event.category,
            priority: event.priority
          })
        }
      }
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate weekly stats
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const weeklyEvents = events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= weekStart && eventDate < weekEnd
    })

    const weeklyStats = {
      assignments: weeklyEvents.filter(e => e.type === 'assignment').length,
      quizzes: weeklyEvents.filter(e => e.type === 'quiz').length,
      notes: weeklyEvents.filter(e => e.type === 'note').length,
      holidays: weeklyEvents.filter(e => e.type === 'holiday').length,
      academic: weeklyEvents.filter(e => e.type === 'academic').length,
      todos: weeklyEvents.filter(e => e.type === 'todo').length
    }

    // Get upcoming events (next 7 days)
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }).slice(0, 10)

    return NextResponse.json({
      events,
      upcomingEvents,
      weeklyStats
    })

  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
