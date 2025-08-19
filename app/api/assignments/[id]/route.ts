import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for updating an assignment
const updateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class ID is required').optional(),
  noteId: z.string().optional(),
  dueDate: z.string().optional(), // ISO string
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
  fileUrl: z.string().optional(),
  category: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch the assignment with class and professor info
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            professorId: true
          }
        },
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (user.role === 'PROFESSOR') {
      // Professors can only view their own assignments
      if (assignment.professor.id !== userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (user.role === 'STUDENT') {
      // Students can view assignments from classes they are enrolled in
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          classId: assignment.class.id
        }
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Access denied - not enrolled in this class' },
          { status: 403 }
        )
      }
    }

    // Transform the response to include className
    const transformedAssignment = {
      ...assignment,
      className: `${assignment.class.code} - ${assignment.class.name}`
    }

    return NextResponse.json(transformedAssignment)
  } catch (error) {
    console.error('Error fetching assignment:', error)
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
    const assignmentId = params.id
    const body = await request.json()
    const validatedData = updateAssignmentSchema.parse(body)

    // Get professor ID from request
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
        { error: 'Only professors can update assignments' },
        { status: 403 }
      )
    }

    // Check if assignment exists and belongs to the professor
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        professorId: professorId
      }
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      )
    }

    // If classId is being updated, verify the class exists and belongs to the professor
    if (validatedData.classId && validatedData.classId !== existingAssignment.classId) {
      const classData = await prisma.class.findUnique({
        where: { id: validatedData.classId, professorId }
      })

      if (!classData) {
        return NextResponse.json(
          { error: 'Class not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Verify the note exists and belongs to the professor (if noteId is provided)
    if (validatedData.noteId) {
      const noteData = await prisma.note.findUnique({
        where: { id: validatedData.noteId, professorId }
      })

      if (!noteData) {
        return NextResponse.json(
          { error: 'Note not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Update the assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.classId && { classId: validatedData.classId }),
        ...(validatedData.noteId !== undefined && { noteId: validatedData.noteId }),
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.fileUrl !== undefined && { fileUrl: validatedData.fileUrl }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
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
      }
    })

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating assignment:', error)
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
    const assignmentId = params.id

    // Get professor ID from request
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
        { error: 'Only professors can delete assignments' },
        { status: 403 }
      )
    }

    // Check if assignment exists and belongs to the professor
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        professorId: professorId
      }
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the assignment
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
