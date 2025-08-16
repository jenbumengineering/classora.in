import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const archiveClassSchema = z.object({
  isArchived: z.boolean()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const classId = params.id
    const body = await request.json()
    const validatedData = archiveClassSchema.parse(body)

    // Check if class exists and user is the professor
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { professorId: true, name: true }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    if (classData.professorId !== userId) {
      return NextResponse.json(
        { error: 'Access denied. Only the professor can archive this class.' },
        { status: 403 }
      )
    }

    // Update the class archive status
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        isArchived: validatedData.isArchived,
        archivedAt: validatedData.isArchived ? new Date() : null
      },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherProfile: {
              select: {
                university: true,
                department: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            notes: true,
            quizzes: true,
            assignments: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Class "${classData.name}" ${validatedData.isArchived ? 'archived' : 'unarchived'} successfully`,
      class: updatedClass
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error archiving class:', error)
    return NextResponse.json(
      { error: 'Failed to archive class' },
      { status: 500 }
    )
  }
}
