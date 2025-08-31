import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Validation schema for assignment queries
const assignmentQuerySchema = z.object({
  classId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const validatedData = assignmentQuerySchema.parse(Object.fromEntries(searchParams))

    // Get user ID from request (optional for public class view)
    const userId = request.headers.get('x-user-id')
    let user = null
    
    if (userId) {
      // Get user information if provided
      user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Build the where clause for filtering
    const whereClause: any = {}
    
    if (validatedData.classId) {
      whereClause.classId = validatedData.classId
    }
    
    if (validatedData.status) {
      whereClause.status = validatedData.status
    }

    // Filter assignments based on user role
    if (user) {
      if (user.role === 'PROFESSOR') {
        // Professors see their own assignments
        whereClause.professorId = userId
      } else if (user.role === 'STUDENT') {
        // Students see assignments from classes they are enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: userId! },
          select: { classId: true }
        })
        
        const enrolledClassIds = enrollments.map(e => e.classId)
        if (enrolledClassIds.length === 0) {
          // If student is not enrolled in any classes, return empty list
          return NextResponse.json({
            assignments: [],
            total: 0,
            limit: parseInt(validatedData.limit || '20'),
            offset: parseInt(validatedData.offset || '0')
          })
        }
        
        whereClause.classId = { in: enrolledClassIds }
      }
    }
    // If no user (public access), only show published assignments for the specified class

    // Fetch assignments from database
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
        },
        // Include submission status for students
        ...(user?.role === 'STUDENT' ? {
                  submissions: {
          where: { studentId: userId },
          select: { id: true, grade: true }
        }
        } : {}),
        // Include submission count for professors
        ...(user?.role === 'PROFESSOR' ? {
          _count: {
            select: { submissions: true }
          }
        } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(validatedData.limit || '20'),
      skip: parseInt(validatedData.offset || '0')
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
      noteId: assignment.noteId || null,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      professor: assignment.professor,
      // Add submission status for students
      ...(user?.role === 'STUDENT' ? {
        submitted: assignment.submissions && assignment.submissions.length > 0,
        graded: assignment.submissions && assignment.submissions.some(sub => sub.grade !== null),
        grade: assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions[0].grade : null
      } : {}),
      // Add submission count for professors
      ...(user?.role === 'PROFESSOR' ? {
        _count: assignment._count
      } : {})
    }))

    // Get total count for pagination
    const total = await prisma.assignment.count({
      where: whereClause
    })

    return NextResponse.json({
      assignments: transformedAssignments,
      total: total,
      limit: parseInt(validatedData.limit || '20'),
      offset: parseInt(validatedData.offset || '0')
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validation schema for creating an assignment
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  noteId: z.string().optional(),
  dueDate: z.string().optional(), // ISO string
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
  fileUrl: z.string().optional(),
  category: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAssignmentSchema.parse(body)

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
      where: { 
        id: professorId, 
        role: 'PROFESSOR'
      }
    })

    if (!professor) {
      return NextResponse.json(
        { error: 'Only professors can create assignments' },
        { status: 403 }
      )
    }

    // Verify the class exists and belongs to the professor
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId, professorId }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
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

    // Create the assignment in the database
    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: validatedData.status,
        fileUrl: validatedData.fileUrl || null,
        category: validatedData.category || null,
        classId: validatedData.classId,
        professorId: professorId,
        noteId: validatedData.noteId || null,
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

    // Send email notifications to enrolled students if assignment is published
    if (validatedData.status === 'PUBLISHED') {
      try {
        // Get all enrolled students
        const enrollments = await prisma.enrollment.findMany({
          where: { classId: validatedData.classId },
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

        // Send email to each enrolled student in background
        for (const enrollment of enrollments) {
          sendEmail(enrollment.student.email, 'newAssignment', {
            studentName: enrollment.student.name,
            assignmentTitle: validatedData.title,
            className: classData.name,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate).toLocaleDateString() : 'No due date',
            studentEmail: enrollment.student.email
          }).then(() => {
            console.log(`New assignment email sent to: ${enrollment.student.email}`)
          }).catch((emailError) => {
            console.error(`Failed to send email to ${enrollment.student.email}:`, emailError)
          })
        }
      } catch (notificationError) {
        console.error('Error sending assignment notifications:', notificationError)
        // Don't fail the assignment creation if email notifications fail
      }
    }

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
