import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classId = params.id

    // Verify the class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Fetch only published assignments for the class
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: classId,
        status: 'PUBLISHED'
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      classId: assignment.classId,
      className: `${assignment.class.code} - ${assignment.class.name}`,
      dueDate: assignment.dueDate?.toISOString(),
      status: assignment.status,
      category: assignment.category || '',
      fileUrl: assignment.fileUrl || '',
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      professor: assignment.professor
    }))

    return NextResponse.json({
      assignments: transformedAssignments,
      total: transformedAssignments.length
    })
  } catch (error) {
    console.error('Error fetching public assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
