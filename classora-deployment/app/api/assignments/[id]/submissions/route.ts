import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id
    const professorId = request.headers.get('x-user-id')

    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the professor exists and owns this assignment
    const assignment = await prisma.assignment.findFirst({
      where: { 
        id: assignmentId,
        professorId: professorId
      },
      include: {
        class: {
          include: {
            enrollments: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Get all submissions for this assignment
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: assignmentId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Get enrolled students who haven't submitted yet
    const enrolledStudents = assignment.class.enrollments.map(enrollment => enrollment.student)
    const submittedStudentIds = submissions.map(submission => submission.studentId)
    const studentsWithoutSubmission = enrolledStudents.filter(
      student => !submittedStudentIds.includes(student.id)
    )

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        status: assignment.status
      },
      submissions: submissions.map(submission => ({
        id: submission.id,
        studentId: submission.studentId,
        studentName: submission.student.name,
        studentEmail: submission.student.email,
        fileUrl: submission.fileUrl,
        feedback: submission.feedback,
        submittedAt: submission.submittedAt,
        grade: submission.grade,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy
      })),
      studentsWithoutSubmission: studentsWithoutSubmission.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email
      })),
      totalEnrolled: enrolledStudents.length,
      totalSubmitted: submissions.length,
      totalGraded: submissions.filter(s => s.grade !== null).length
    })

  } catch (error) {
    console.error('Error fetching assignment submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
