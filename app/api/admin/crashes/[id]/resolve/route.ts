import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const crashId = params.id

    // In a real implementation, you would update the crash report in the database
    // For now, we'll just return success since we're using mock data
    console.log(`Marking crash ${crashId} as resolved`)

    return NextResponse.json({
      success: true,
      message: 'Crash marked as resolved'
    })

  } catch (error) {
    console.error('Error marking crash as resolved:', error)
    return NextResponse.json(
      { error: 'Failed to mark crash as resolved' },
      { status: 500 }
    )
  }
}
