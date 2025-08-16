import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

const createBackupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional()
})

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

    // Get all backups from database
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      backups: backups
    })

  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    )
  }
}

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

    let validatedData = { name: undefined, description: undefined }
    
    try {
      const body = await request.json()
      validatedData = createBackupSchema.parse(body)
    } catch (jsonError) {
      // If no JSON body is provided, use default values
      console.log('No JSON body provided, using default values')
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = validatedData.name || `backup-${timestamp}`
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
          type: 'manual',
          status: 'completed',
          size: stats.size,
          path: backupPath,
          description: validatedData.description || 'Manual backup created by admin',
          createdBy: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backup: backup
      })
    } else {
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}
