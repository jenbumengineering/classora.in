import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Validation schema for creating a note
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  classId: z.string().min(1, 'Class ID is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE']).default('DRAFT'),
})

// Validation schema for searching notes
const searchNotesSchema = z.object({
  query: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  professorId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE']).optional().nullable(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a professor
    const professor = await prisma.user.findUnique({
      where: { 
        id: professorId, 
        role: 'PROFESSOR'
      }
    })

    if (!professor) {
      return NextResponse.json(
        { error: 'Only professors can create notes' },
        { status: 403 }
      )
    }

    // Verify the class exists and belongs to the professor
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId, professorId }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Create the note
    const newNote = await prisma.note.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        status: validatedData.status,
        classId: validatedData.classId,
        professorId: professorId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Send email notifications to enrolled students if note is published
    if (validatedData.status === 'PUBLISHED') {
      try {
        // Get all enrolled students
        const enrollments = await prisma.enrollment.findMany({
          where: { classId: validatedData.classId },
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

        // Send email to each enrolled student in background
        for (const enrollment of enrollments) {
          sendEmail(enrollment.student.email, 'newNote', {
            studentName: enrollment.student.name,
            noteTitle: validatedData.title,
            className: classData.name,
            studentEmail: enrollment.student.email
          }).then(() => {
            console.log(`New note email sent to: ${enrollment.student.email}`)
          }).catch((emailError) => {
            console.error(`Failed to send email to ${enrollment.student.email}:`, emailError)
          })
        }
      } catch (notificationError) {
        console.error('Error sending note notifications:', notificationError)
        // Don't fail the note creation if email notifications fail
      }
    }

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || undefined
    const classId = searchParams.get('classId') || undefined
    const professorId = searchParams.get('professorId') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const validatedData = searchNotesSchema.parse({
      query,
      classId,
      professorId,
      status,
      limit,
      offset,
    })

    // Build the where clause
    const where: any = {}
    
    if (validatedData.query) {
      where.OR = [
        { title: { contains: validatedData.query } },
        { content: { contains: validatedData.query } },
      ]
    }

    if (validatedData.classId) {
      where.classId = validatedData.classId
    }

    if (validatedData.professorId) {
      where.professorId = validatedData.professorId
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    // Get notes with class and professor information
    const notes = await prisma.note.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: validatedData.limit,
      skip: validatedData.offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.note.count({ where })

    return NextResponse.json({
      notes,
      pagination: {
        total: totalCount,
        limit: validatedData.limit,
        offset: validatedData.offset,
        hasMore: validatedData.offset + validatedData.limit < totalCount,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
