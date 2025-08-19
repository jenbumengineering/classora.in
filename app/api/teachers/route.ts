import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for filtering
    const whereClause: any = {
      role: 'PROFESSOR'
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { teacherProfile: { university: { contains: query, mode: 'insensitive' } } },
        { teacherProfile: { department: { contains: query, mode: 'insensitive' } } }
      ]
    }

    // Get professors with their classes and profile
    const professors = await prisma.user.findMany({
      where: whereClause,
      include: {
        teacherProfile: true,
        classes: {
          include: {
            _count: {
              select: {
                enrollments: true,
                notes: true,
                quizzes: true,
                assignments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            classes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const total = await prisma.user.count({
      where: whereClause
    })

    // Transform data for frontend
    const transformedProfessors = professors.map(professor => ({
      id: professor.id,
      name: professor.name,
      email: professor.email,
      avatar: professor.avatar,
      university: professor.teacherProfile?.university || 'Not specified',
      department: professor.teacherProfile?.department || 'Not specified',

      totalClasses: professor._count.classes,
      classes: professor.classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        description: cls.description,
        createdAt: cls.createdAt,
        _count: cls._count
      }))
    }))

    return NextResponse.json({
      professors: transformedProfessors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching professors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
