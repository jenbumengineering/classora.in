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

    // Mock performance metrics (in real implementation, these would come from system monitoring)
    const metrics = {
      cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
      diskUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
      networkLatency: Math.floor(Math.random() * 50) + 10, // 10-60ms
      activeConnections: Math.floor(Math.random() * 100) + 50, // 50-150
      responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      errorRate: Math.random() * 2, // 0-2%
      uptime: '15 days, 8 hours, 32 minutes',
      lastUpdated: new Date().toISOString()
    }

    // Determine system health based on metrics
    const issues: string[] = []
    const recommendations: string[] = []

    if (metrics.cpuUsage > 80) {
      issues.push('High CPU usage detected')
      recommendations.push('Consider scaling up server resources')
    }

    if (metrics.memoryUsage > 85) {
      issues.push('High memory usage detected')
      recommendations.push('Monitor memory usage and optimize applications')
    }

    if (metrics.diskUsage > 90) {
      issues.push('Disk space running low')
      recommendations.push('Clean up unnecessary files or expand storage')
    }

    if (metrics.errorRate > 1) {
      issues.push('Error rate is above normal threshold')
      recommendations.push('Investigate recent errors in logs')
    }

    if (metrics.responseTime > 200) {
      issues.push('Response time is slower than usual')
      recommendations.push('Check database performance and optimize queries')
    }

    // Determine overall system status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (issues.length > 2) {
      status = 'critical'
    } else if (issues.length > 0) {
      status = 'warning'
    }

    // Generate historical data for charts (last 24 hours, 30-minute intervals)
    const historicalData = []
    const now = new Date()
    for (let i = 48; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000) // 30-minute intervals
      historicalData.push({
        timestamp: timestamp.toISOString(),
        cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
        memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
        diskUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
        networkLatency: Math.floor(Math.random() * 50) + 20, // 20-70ms
        activeConnections: Math.floor(Math.random() * 50) + 10, // 10-60
        responseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
        errorRate: Math.random() * 2 // 0-2%
      })
    }

    const health = {
      status,
      issues,
      recommendations
    }

    return NextResponse.json({
      metrics,
      health,
      historicalData
    })

  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
