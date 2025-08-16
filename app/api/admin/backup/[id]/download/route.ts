import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(
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

    // Check if backup file exists
    if (!backup.path || !fs.existsSync(backup.path)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      )
    }

    // Read the backup file
    const fileBuffer = fs.readFileSync(backup.path)
    
    // Create response with file
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', 'application/octet-stream')
    response.headers.set('Content-Disposition', `attachment; filename="${backup.name}.db"`)
    
    return response

  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    )
  }
}
