import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const classId = params.id

    // Verify the user is a professor and owns this class
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { professorId: true }
    })

    if (!classData || classData.professorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all students enrolled in this professor's classes
    const professorClasses = await prisma.class.findMany({
      where: { professorId: userId },
      select: { id: true }
    })

    const professorClassIds = professorClasses.map(c => c.id)
    // Get all enrollments in professor's classes
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId: { in: professorClassIds }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Get current class enrollments
    const currentClassEnrollments = await prisma.enrollment.findMany({
      where: { classId },
      select: { studentId: true }
    })

    const currentClassStudentIds = currentClassEnrollments.map(e => e.studentId)

    // Filter out students already enrolled in current class and get unique students
    const availableStudents = enrollments
      .filter(enrollment => !currentClassStudentIds.includes(enrollment.studentId))
      .map(enrollment => enrollment.student)
      .filter((student, index, self) => 
        index === self.findIndex(s => s.id === student.id)
      )

    return NextResponse.json({ students: availableStudents })
  } catch (error) {
    console.error('Error fetching available students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available students' },
      { status: 500 }
    )
  }
}
