import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from headers (assuming admin authentication)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin (you can add role check here)
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

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalClasses,
      totalAssignments,
      totalQuizzes,
      totalNotes,
      totalEnrollments,
      unreadMessages,
      activeUsers,
      lastBackupData
    ] = await Promise.all([
      prisma.user.count(),
      prisma.class.count(),
      prisma.assignment.count(),
      prisma.quiz.count(),
      prisma.note.count(),
      prisma.enrollment.count(),
      // Count unread contact messages
      prisma.contactMessage.count({
        where: {
          read: false
        }
      }),
      // Active users (users who logged in within last 7 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Get last backup information using Prisma model
      prisma.backup.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { name: true, createdAt: true }
      })
    ])

    // Mock system health (in real implementation, this would check actual system metrics)
    const systemHealth = 'healthy' // Could be 'healthy', 'warning', or 'critical'
    
    // Get last backup time from database
    let lastBackup = 'Never'
    if (lastBackupData) {
      const backupDate = new Date(lastBackupData.createdAt)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - backupDate.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) {
        lastBackup = 'Just now'
      } else if (diffInHours < 24) {
        lastBackup = `${diffInHours} hours ago`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        lastBackup = `${diffInDays} days ago`
      }
    }

    return NextResponse.json({
      totalUsers,
      totalClasses,
      totalAssignments,
      totalQuizzes,
      totalNotes,
      totalEnrollments,
      unreadMessages,
      systemHealth,
      lastBackup,
      activeUsers
    })

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
