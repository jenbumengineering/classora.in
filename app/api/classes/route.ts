import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for creating a class
const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  code: z.string().min(1, 'Class code is required'),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
  gradientColor: z.string().optional(),
  imageUrl: z.string().optional(),
})

// Validation schema for searching classes
const searchClassesSchema = z.object({
  query: z.string().optional().nullable(),
  professorId: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  includeArchived: z.boolean().default(false),
  includePrivate: z.boolean().default(true),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createClassSchema.parse(body)

    // Check if class code already exists
    const existingClass = await prisma.class.findUnique({
      where: { code: validatedData.code }
    })

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class code already exists' },
        { status: 400 }
      )
    }

    // Get professor ID from request (in a real app, this would come from session)
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a professor
    const professor = await prisma.user.findUnique({
      where: { id: professorId, role: 'PROFESSOR' }
    })

    if (!professor) {
      return NextResponse.json(
        { error: 'Only professors can create classes' },
        { status: 403 }
      )
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        isPrivate: validatedData.isPrivate,
        gradientColor: validatedData.gradientColor,
        imageUrl: validatedData.imageUrl,
        professorId: professorId,
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

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating class:', error)
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
    const professorId = searchParams.get('professorId') || undefined
    const university = searchParams.get('university') || undefined
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const includePrivate = searchParams.get('includePrivate') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const validatedData = searchClassesSchema.parse({
      query,
      professorId,
      university,
      includeArchived,
      includePrivate,
      limit,
      offset,
    })

    // Build the where clause
    const where: any = {}
    
    // Filter by archived status
    if (!validatedData.includeArchived) {
      where.isArchived = false
    }

    // Filter by private status
    if (!validatedData.includePrivate) {
      where.isPrivate = false
    }
    
    if (validatedData.query) {
      where.OR = [
        { name: { contains: validatedData.query } },
        { code: { contains: validatedData.query } },
        { description: { contains: validatedData.query } },
        { professor: { name: { contains: validatedData.query } } },
      ]
    }

    if (validatedData.professorId) {
      where.professorId = validatedData.professorId
    }

    if (validatedData.university) {
      where.professor = {
        teacherProfile: {
          OR: [
            { university: { contains: validatedData.university } },
            { college: { contains: validatedData.university } }
          ]
        }
      }
    }

    // Get classes with professor information
    const classes = await prisma.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isPrivate: true,
        isArchived: true,
        archivedAt: true,
        gradientColor: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
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
      },
      orderBy: { createdAt: 'desc' },
      take: validatedData.limit,
      skip: validatedData.offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.class.count({ where })

    return NextResponse.json({
      classes,
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

    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
