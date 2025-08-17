import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPracticeFileSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().transform(val => val === '' ? undefined : val),
  fileUrl: z.string().min(1, 'File URL is required').refine(
    (url) => url.startsWith('/uploads/'),
    { message: 'File URL must be a valid upload path' }
  ),
  classId: z.string().min(1, 'Class ID is required'),
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
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this class
    let hasAccess = false
    if (user.role === 'PROFESSOR') {
      const classExists = await prisma.class.findFirst({
        where: { id: classId, professorId: userId }
      })
      hasAccess = !!classExists
    } else {
      const enrollment = await prisma.enrollment.findFirst({
        where: { classId, studentId: userId }
      })
      hasAccess = !!enrollment
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get practice files for the class
    const files = await prisma.practiceFile.findMany({
      where: { classId },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({
      files: files.map(file => ({
        id: file.id,
        title: file.title,
        fileUrl: file.fileUrl,
        uploadedAt: file.uploadedAt.toISOString()
      })),
      total: files.length
    })
  } catch (error) {
    console.error('Error fetching practice files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'PROFESSOR' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Only professors can upload practice files' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Received body:', body) // Debug log
    
    const validatedData = createPracticeFileSchema.parse(body)

    // Verify the professor owns the class
    const classExists = await prisma.class.findFirst({
      where: { id: validatedData.classId, professorId: userId }
    })

    if (!classExists) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    const file = await prisma.practiceFile.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        fileUrl: validatedData.fileUrl,
        classId: validatedData.classId,
        professorId: userId,
      }
    })

    return NextResponse.json({
      id: file.id,
      title: file.title,
      fileUrl: file.fileUrl,
      uploadedAt: file.uploadedAt.toISOString()
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors) // Debug log
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating practice file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
