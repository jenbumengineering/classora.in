import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for updating a note
const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id

    const note = await prisma.note.findUnique({
      where: { id: noteId },
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

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id
    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if note exists and belongs to the professor
    const existingNote = await prisma.note.findUnique({
      where: { id: noteId, professorId }
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found or access denied' },
        { status: 404 }
      )
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: validatedData,
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

    return NextResponse.json(updatedNote)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if note exists and belongs to the professor
    const existingNote = await prisma.note.findUnique({
      where: { id: noteId, professorId }
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the note
    await prisma.note.delete({
      where: { id: noteId }
    })

    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
