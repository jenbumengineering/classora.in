import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = acceptInvitationSchema.parse(body)

    // Find the invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token: validatedData.token },
      include: {
        class: true,
        professor: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Get user ID from request (user must be logged in)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already enrolled in this class
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: userId,
          classId: invitation.classId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: userId,
        classId: invitation.classId
      },
      include: {
        class: true,
        student: true
      }
    })

    // Update invitation status to accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${invitation.class.name}`,
      enrollment: {
        id: enrollment.id,
        classId: enrollment.classId,
        className: enrollment.class.name,
        enrolledAt: enrollment.enrolledAt
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
