import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No backup file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.sql')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .sql files are supported' },
        { status: 400 }
      )
    }

    // Get database path
    let dbPath = 'prisma/dev.db' // Default path
    if (process.env.DATABASE_URL) {
      if (process.env.DATABASE_URL.startsWith('file:')) {
        dbPath = process.env.DATABASE_URL.replace('file:', '')
      } else if (process.env.DATABASE_URL.startsWith('sqlite:')) {
        dbPath = process.env.DATABASE_URL.replace('sqlite:', '')
      }
    }
    
    // Resolve relative path to absolute path
    if (dbPath.startsWith('./')) {
      dbPath = path.join(process.cwd(), dbPath)
    } else if (!path.isAbsolute(dbPath)) {
      dbPath = path.join(process.cwd(), dbPath)
    }

    // Create a temporary backup of current database
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const tempBackupPath = path.join(process.cwd(), 'backups', `pre-restore-backup-${timestamp}.sql`)
    
    try {
      // Create backup directory if it doesn't exist
      const backupDir = path.join(process.cwd(), 'backups')
      await fs.mkdir(backupDir, { recursive: true })
      
      // Create backup of current database
      await fs.copyFile(dbPath, tempBackupPath)
      console.log('Pre-restore backup created:', tempBackupPath)
      
      // Convert uploaded file to buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      
      // Write the uploaded file to the database location
      await fs.writeFile(dbPath, fileBuffer)
      console.log('Database restored from backup file')
      
      // Close Prisma connection to ensure it picks up the new database
      await prisma.$disconnect()
      
      return NextResponse.json({
        success: true,
        message: 'Database restored successfully',
        preRestoreBackup: path.basename(tempBackupPath)
      })
      
    } catch (restoreError) {
      console.error('Error during restore:', restoreError)
      
      // Try to restore from the pre-restore backup if restore failed
      try {
        if (await fs.access(tempBackupPath).then(() => true).catch(() => false)) {
          await fs.copyFile(tempBackupPath, dbPath)
          console.log('Database restored from pre-restore backup after failure')
        }
      } catch (recoveryError) {
        console.error('Failed to recover from pre-restore backup:', recoveryError)
      }
      
      let errorMessage = 'Failed to restore database'
      if (restoreError instanceof Error) {
        if (restoreError.message.includes('ENOENT')) {
          errorMessage = 'Database file not found. Please check your DATABASE_URL configuration.'
        } else if (restoreError.message.includes('EACCES')) {
          errorMessage = 'Permission denied. Please check file permissions.'
        } else {
          errorMessage = restoreError.message
        }
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: 'Internal server error during restore' },
      { status: 500 }
    )
  }
}
