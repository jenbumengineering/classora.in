import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim()

    // Get user to determine role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const results: Array<{
      id: string
      title: string
      subtitle?: string
      type: 'class' | 'note' | 'quiz' | 'assignment' | 'student'
    }> = []

    if (user.role === 'PROFESSOR') {
      // Search professor's own content
      
      // Search classes
      const classes = await prisma.class.findMany({
        where: {
          professorId: userId,
          OR: [
            { name: { contains: searchTerm } },
            { code: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ]
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true
        },
        take: 5
      })

      classes.forEach(cls => {
        results.push({
          id: cls.id,
          title: cls.name,
          subtitle: cls.code,
          type: 'class'
        })
      })

      // Search notes
      const notes = await prisma.note.findMany({
        where: {
          professorId: userId,
          OR: [
            { title: { contains: searchTerm } },
            { content: { contains: searchTerm } }
          ]
        },
        select: {
          id: true,
          title: true,
          content: true
        },
        take: 5
      })

      notes.forEach(note => {
        results.push({
          id: note.id,
          title: note.title,
          subtitle: note.content?.substring(0, 100) + '...',
          type: 'note'
        })
      })

      // Search quizzes
      const quizzes = await prisma.quiz.findMany({
        where: {
          professorId: userId,
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true
        },
        take: 5
      })

      quizzes.forEach(quiz => {
        results.push({
          id: quiz.id,
          title: quiz.title,
          subtitle: quiz.description || undefined,
          type: 'quiz'
        })
      })

      // Search assignments
      const assignments = await prisma.assignment.findMany({
        where: {
          professorId: userId,
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true
        },
        take: 5
      })

      assignments.forEach(assignment => {
        results.push({
          id: assignment.id,
          title: assignment.title,
          subtitle: assignment.description || undefined,
          type: 'assignment'
        })
      })

      // Search students enrolled in professor's classes
      const enrollments = await prisma.enrollment.findMany({
        where: {
          class: {
            professorId: userId
          },
          student: {
            OR: [
              { name: { contains: searchTerm } },
              { email: { contains: searchTerm } }
            ]
          }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
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
        take: 5
      })

      // Group enrollments by student to avoid duplicates
      const studentMap = new Map()
      enrollments.forEach(enrollment => {
        if (!studentMap.has(enrollment.student.id)) {
          studentMap.set(enrollment.student.id, {
            student: enrollment.student,
            classes: []
          })
        }
        studentMap.get(enrollment.student.id).classes.push(enrollment.class)
      })

      studentMap.forEach(({ student, classes }) => {
        results.push({
          id: student.id,
          title: student.name,
          subtitle: `${student.email} • ${classes.map(c => c.code).join(', ')}`,
          type: 'student'
        })
      })

    } else if (user.role === 'STUDENT') {
      // Search student's enrolled classes and their content
      
      // Get enrolled classes
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { classId: true }
      })

      const classIds = enrollments.map(e => e.classId)

      if (classIds.length > 0) {
        // Search classes
        const classes = await prisma.class.findMany({
          where: {
            id: { in: classIds },
            OR: [
              { name: { contains: searchTerm } },
              { code: { contains: searchTerm } },
              { description: { contains: searchTerm } }
            ]
          },
          select: {
            id: true,
            name: true,
            code: true,
            description: true
          },
          take: 5
        })

        classes.forEach(cls => {
          results.push({
            id: cls.id,
            title: cls.name,
            subtitle: cls.code,
            type: 'class'
          })
        })

        // Search notes (published only)
        const notes = await prisma.note.findMany({
          where: {
            classId: { in: classIds },
            status: 'PUBLISHED',
            OR: [
              { title: { contains: searchTerm } },
              { content: { contains: searchTerm } }
            ]
          },
          select: {
            id: true,
            title: true,
            content: true
          },
          take: 5
        })

        notes.forEach(note => {
          results.push({
            id: note.id,
            title: note.title,
            subtitle: note.content?.substring(0, 100) + '...',
            type: 'note'
          })
        })

        // Search quizzes (published only)
        const quizzes = await prisma.quiz.findMany({
          where: {
            classId: { in: classIds },
            status: 'PUBLISHED',
            OR: [
              { title: { contains: searchTerm } },
              { description: { contains: searchTerm } }
            ]
          },
          select: {
            id: true,
            title: true,
            description: true
          },
          take: 5
        })

        quizzes.forEach(quiz => {
          results.push({
            id: quiz.id,
            title: quiz.title,
            subtitle: quiz.description || undefined,
            type: 'quiz'
          })
        })

        // Search assignments (published only)
        const assignments = await prisma.assignment.findMany({
          where: {
            classId: { in: classIds },
            status: 'PUBLISHED',
            OR: [
              { title: { contains: searchTerm } },
              { description: { contains: searchTerm } }
            ]
          },
          select: {
            id: true,
            title: true,
            description: true
          },
          take: 5
        })

        assignments.forEach(assignment => {
          results.push({
            id: assignment.id,
            title: assignment.title,
            subtitle: assignment.description || undefined,
            type: 'assignment'
          })
        })
      }
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm.toLowerCase())
      const bExact = b.title.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    return NextResponse.json({
      results: sortedResults.slice(0, 10) // Limit to 10 results
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
