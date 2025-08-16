import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for enrollment
const enrollmentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = enrollmentSchema.parse(body)

    // Get student ID from request
    const studentId = request.headers.get('x-user-id')
    if (!studentId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Only students can enroll in classes' },
        { status: 403 }
      )
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: studentId,
          classId: validatedData.classId,
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this class' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: studentId,
        classId: validatedData.classId,
      },
      include: {
        class: {
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
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')

    // Get user ID from request
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Build the where clause
    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId
    }

    if (classId) {
      where.classId = classId
    }

    // If no specific studentId provided, use the authenticated user's ID
    if (!studentId) {
      where.studentId = userId
    }

    // Get enrollments with class and professor information
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        class: {
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
                notes: true,
                quizzes: true,
                assignments: true,
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
