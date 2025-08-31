import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const classId = params.id
    const { studentIds } = await request.json()

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs required' }, { status: 400 })
    }

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

    // Verify all students exist and are actually students
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT'
      },
      select: { id: true, name: true, email: true }
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: 'Some students not found or invalid' }, { status: 400 })
    }

    // Check for existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        studentId: { in: studentIds }
      },
      select: { studentId: true }
    })

    const existingStudentIds = existingEnrollments.map(e => e.studentId)
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id))

    if (newStudentIds.length === 0) {
      return NextResponse.json({ error: 'All students are already enrolled in this class' }, { status: 400 })
    }

    // Create enrollments for new students
    const enrollments = await prisma.enrollment.createMany({
      data: newStudentIds.map(studentId => ({
        classId,
        studentId,
        enrolledAt: new Date()
      }))
    })

    return NextResponse.json({ 
      message: `Successfully invited ${enrollments.count} students`,
      invitedCount: enrollments.count
    })
  } catch (error) {
    console.error('Error inviting existing students:', error)
    return NextResponse.json(
      { error: 'Failed to invite students' },
      { status: 500 }
    )
  }
}
