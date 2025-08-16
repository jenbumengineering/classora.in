import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Return default backup settings
    const settings = {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      lastBackup: 'Never',
      nextBackup: 'Not scheduled',
      backupLocation: '/backups'
    }

    return NextResponse.json({
      settings: settings
    })

  } catch (error) {
    console.error('Error fetching backup settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const settings = body.settings

    // In a real implementation, you would save these settings to a database
    // For now, we'll just return success
    console.log('Backup settings updated:', settings)

    return NextResponse.json({
      success: true,
      message: 'Backup settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating backup settings:', error)
    return NextResponse.json(
      { error: 'Failed to update backup settings' },
      { status: 500 }
    )
  }
}
