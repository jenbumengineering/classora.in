import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const privacyClassSchema = z.object({
  isPrivate: z.boolean()
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
    const validatedData = privacyClassSchema.parse(body)

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
        { error: 'Access denied. Only the professor can change privacy settings.' },
        { status: 403 }
      )
    }

    // Update the class privacy status
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        isPrivate: validatedData.isPrivate
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
      message: `Class "${classData.name}" is now ${validatedData.isPrivate ? 'private' : 'public'}`,
      class: updatedClass
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating class privacy:', error)
    return NextResponse.json(
      { error: 'Failed to update class privacy' },
      { status: 500 }
    )
  }
}
