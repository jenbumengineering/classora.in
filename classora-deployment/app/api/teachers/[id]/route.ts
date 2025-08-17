import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id

    const teacher = await prisma.user.findUnique({
      where: { 
        id: teacherId,
        role: 'PROFESSOR'
      },
      include: {
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
        classes: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                enrollments: true,
                notes: true,
                quizzes: true,
                assignments: true,
              }
            }
          }
        },
        _count: {
          select: {
            classes: true,
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error fetching teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
