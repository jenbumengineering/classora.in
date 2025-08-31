import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const classId = params.id

    // Check if user has access to this class
    if (user.role === 'PROFESSOR') {
      const classData = await prisma.class.findFirst({
        where: { id: classId, professorId: user.id }
      })
      if (!classData) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classId: { studentId: user.id, classId } }
      })
      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get enrollments for the class
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching class enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
