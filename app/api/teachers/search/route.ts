import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for searching teachers
const searchTeachersSchema = z.object({
  query: z.string().optional(),
  university: z.string().optional(),
  department: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const university = searchParams.get('university')
    const department = searchParams.get('department')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const validatedData = searchTeachersSchema.parse({
      query,
      university,
      department,
      limit,
      offset,
    })

    // Build the where clause
    const where: any = {
      role: 'PROFESSOR'
    }
    
    if (validatedData.query) {
      where.OR = [
        { name: { contains: validatedData.query, mode: 'insensitive' } },
        { email: { contains: validatedData.query, mode: 'insensitive' } },
        { bio: { contains: validatedData.query, mode: 'insensitive' } },
        { teacherProfile: { 
          OR: [
            { university: { contains: validatedData.query, mode: 'insensitive' } },
            { department: { contains: validatedData.query, mode: 'insensitive' } },
            { researchInterests: { contains: validatedData.query, mode: 'insensitive' } },
          ]
        } },
      ]
    }

    if (validatedData.university) {
      where.teacherProfile = {
        ...where.teacherProfile,
        university: { contains: validatedData.university, mode: 'insensitive' }
      }
    }

    if (validatedData.department) {
      where.teacherProfile = {
        ...where.teacherProfile,
        department: { contains: validatedData.department, mode: 'insensitive' }
      }
    }

    // Get teachers with their profiles and class counts
    const teachers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
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
        },
        _count: {
          select: {
            classes: true,
          }
        }
      },
      orderBy: { name: 'asc' },
      take: validatedData.limit,
      skip: validatedData.offset,
    })

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where })

    return NextResponse.json({
      teachers,
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

    console.error('Error searching teachers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
