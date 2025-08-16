import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Validation schema for updating profile
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  bio: z.string().optional(),
  teacherProfile: z.object({
    university: z.string().optional(),
    college: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  studentProfile: z.object({
    university: z.string().optional(),
    college: z.string().optional(),
    department: z.string().optional(),
    semester: z.string().optional(),
    class: z.string().optional(),
    registrationNo: z.string().optional(),
    rollNo: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        studentProfile: {
          select: {
            university: true,
            college: true,
            department: true,
            semester: true,
            class: true,
            registrationNo: true,
            rollNo: true,
            phone: true,
            address: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user data
    const updateData: any = {}
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        studentProfile: {
          select: {
            university: true,
            college: true,
            department: true,
            semester: true,
            class: true,
            registrationNo: true,
            rollNo: true,
            phone: true,
            address: true,
          }
        }
      }
    })

    // Update teacher profile if provided and user is a professor
    if (validatedData.teacherProfile && existingUser.role === 'PROFESSOR') {
      const teacherProfileData: any = {}
      
      if (validatedData.teacherProfile.university !== undefined) {
        teacherProfileData.university = validatedData.teacherProfile.university
      }
      if (validatedData.teacherProfile.college !== undefined) {
        teacherProfileData.college = validatedData.teacherProfile.college
      }
      if (validatedData.teacherProfile.department !== undefined) {
        teacherProfileData.department = validatedData.teacherProfile.department
      }
      if (validatedData.teacherProfile.phone !== undefined) {
        teacherProfileData.phone = validatedData.teacherProfile.phone
      }
      if (validatedData.teacherProfile.address !== undefined) {
        teacherProfileData.address = validatedData.teacherProfile.address
      }

      // Upsert teacher profile
      await prisma.teacherProfile.upsert({
        where: { userId },
        update: teacherProfileData,
        create: {
          userId,
          ...teacherProfileData
        }
      })

      // Fetch updated user with teacher profile
      const userWithProfile = await prisma.user.findUnique({
        where: { id: userId },
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
          }
        }
      })

      return NextResponse.json(userWithProfile)
    }

    // Update student profile if provided and user is a student
    if (validatedData.studentProfile && existingUser.role === 'STUDENT') {
      const studentProfileData: any = {}
      
      if (validatedData.studentProfile.university !== undefined) {
        studentProfileData.university = validatedData.studentProfile.university
      }
      if (validatedData.studentProfile.college !== undefined) {
        studentProfileData.college = validatedData.studentProfile.college
      }
      if (validatedData.studentProfile.department !== undefined) {
        studentProfileData.department = validatedData.studentProfile.department
      }
      if (validatedData.studentProfile.semester !== undefined) {
        studentProfileData.semester = validatedData.studentProfile.semester
      }
      if (validatedData.studentProfile.class !== undefined) {
        studentProfileData.class = validatedData.studentProfile.class
      }
      if (validatedData.studentProfile.registrationNo !== undefined) {
        studentProfileData.registrationNo = validatedData.studentProfile.registrationNo
      }
      if (validatedData.studentProfile.rollNo !== undefined) {
        studentProfileData.rollNo = validatedData.studentProfile.rollNo
      }
      if (validatedData.studentProfile.phone !== undefined) {
        studentProfileData.phone = validatedData.studentProfile.phone
      }
      if (validatedData.studentProfile.address !== undefined) {
        studentProfileData.address = validatedData.studentProfile.address
      }

      // Upsert student profile
      await prisma.studentProfile.upsert({
        where: { userId },
        update: studentProfileData,
        create: {
          userId,
          ...studentProfileData
        }
      })

      // Fetch updated user with student profile
      const userWithProfile = await prisma.user.findUnique({
        where: { id: userId },
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
          studentProfile: {
            select: {
              university: true,
              college: true,
              department: true,
              semester: true,
              class: true,
              registrationNo: true,
              rollNo: true,
              phone: true,
              address: true,
            }
          }
        }
      })

      return NextResponse.json(userWithProfile)
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
