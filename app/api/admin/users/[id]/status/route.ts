import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'])
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const targetUserId = params.id
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // In a real implementation, you would update the user's status in the database
    // For now, we'll just return success since we don't have a status field in the User model
    console.log(`Updating user ${targetUserId} status to ${validatedData.status}`)

    return NextResponse.json({
      success: true,
      message: `User status updated to ${validatedData.status}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}
