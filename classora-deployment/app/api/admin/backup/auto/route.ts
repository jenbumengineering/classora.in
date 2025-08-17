import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

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

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `auto-backup-${timestamp}`
    const backupFileName = `${backupName}.db`
    const backupPath = path.join(backupDir, backupFileName)

    // Copy the database file
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
      const stats = fs.statSync(backupPath)

      // Create backup record in database
      const backup = await prisma.backup.create({
        data: {
          name: backupName,
          type: 'automatic',
          status: 'completed',
          size: stats.size,
          path: backupPath,
          description: 'Automatic backup created by system',
          createdBy: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Automatic backup created successfully',
        backup: backup
      })
    } else {
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error creating automatic backup:', error)
    return NextResponse.json(
      { error: 'Failed to create automatic backup' },
      { status: 500 }
    )
  }
}
