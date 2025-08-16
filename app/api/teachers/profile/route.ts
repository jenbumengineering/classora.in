import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for teacher profile
const teacherProfileSchema = z.object({
  university: z.string().optional(),
  college: z.string().optional(),
  department: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  researchInterests: z.string().optional(),
  qualifications: z.string().optional(),
  experience: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const professorId = request.headers.get('x-user-id')
    if (!professorId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the user is a professor
    const professor = await prisma.user.findUnique({
      where: { id: professorId, role: 'PROFESSOR' },
      include: {
        teacherProfile: true
      }
    })

    if (!professor) {
      return NextResponse.json(
        { error: 'Professor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(professor)
  } catch (error) {
    console.error('Error fetching teacher profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
        { error: 'Only professors can create teacher profiles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = teacherProfileSchema.parse(body)

    // Check if profile already exists
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId: professorId }
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Teacher profile already exists. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Create the teacher profile
    const teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: professorId,
        ...validatedData
      }
    })

    return NextResponse.json(teacherProfile, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating teacher profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
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
        { error: 'Only professors can update teacher profiles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = teacherProfileSchema.parse(body)

    // Check if profile exists
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId: professorId }
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Teacher profile not found. Use POST to create.' },
        { status: 404 }
      )
    }

    // Update the teacher profile
    const updatedProfile = await prisma.teacherProfile.update({
      where: { userId: professorId },
      data: validatedData
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating teacher profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
