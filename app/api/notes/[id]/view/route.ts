import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id
    const studentId = request.headers.get('x-user-id')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the student exists and is enrolled in the class
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        status: 'PUBLISHED',
        class: {
          enrollments: {
            some: {
              studentId: studentId
            }
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found or access denied' },
        { status: 404 }
      )
    }

    // Mark note as viewed by the student
    await prisma.studentNoteView.upsert({
      where: {
        studentId_noteId: {
          studentId: studentId,
          noteId: noteId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        studentId: studentId,
        noteId: noteId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking note as viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
