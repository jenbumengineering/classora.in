import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'

export async function DELETE(
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

    const backupId = params.id

    // Get backup from database
    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    })

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      )
    }

    // Delete the backup file if it exists
    if (backup.path && fs.existsSync(backup.path)) {
      try {
        fs.unlinkSync(backup.path)
      } catch (fileError) {
        console.error('Error deleting backup file:', fileError)
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the backup record from database
    await prisma.backup.delete({
      where: { id: backupId }
    })

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
}
