import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
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

    // Create a test backup
    const backup = await prisma.backup.create({
      data: {
        name: 'Test Backup',
        type: 'manual',
        status: 'completed',
        size: 1024000, // 1MB
        path: '/backups/test-backup.db',
        description: 'Test backup created for testing purposes',
        createdBy: userId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Test backup created successfully',
      backup
    })

  } catch (error) {
    console.error('Error creating test backup:', error)
    return NextResponse.json(
      { error: 'Failed to create test backup' },
      { status: 500 }
    )
  }
}
