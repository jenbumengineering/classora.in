import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for updating a class
const updateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').optional(),
  code: z.string().min(1, 'Class code is required').optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classId = params.id

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            avatar: true,
            teacherProfile: {
              select: {
                university: true,
                college: true,
                department: true,
                address: true,
                phone: true,
                website: true,
                linkedin: true,
                researchInterests: true,
                qualifications: true,
                experience: true,
              }
            }
          }
        },
        notes: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        quizzes: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        assignments: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
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

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(classData)
  } catch (error) {
    console.error('Error fetching class:', error)
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
    const classId = params.id
    const body = await request.json()
    const validatedData = updateClassSchema.parse(body)

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if class exists and belongs to the professor
    const existingClass = await prisma.class.findUnique({
      where: { id: classId, professorId }
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Check if new code already exists (if code is being updated)
    if (validatedData.code && validatedData.code !== existingClass.code) {
      const codeExists = await prisma.class.findUnique({
        where: { code: validatedData.code }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Class code already exists' },
          { status: 400 }
        )
      }
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: validatedData,
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

    return NextResponse.json(updatedClass)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating class:', error)
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
    const classId = params.id

    // Get professor ID from request
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if class exists and belongs to the professor
    const existingClass = await prisma.class.findUnique({
      where: { id: classId, professorId }
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the class (this will cascade delete related data)
    await prisma.class.delete({
      where: { id: classId }
    })

    return NextResponse.json(
      { message: 'Class deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
