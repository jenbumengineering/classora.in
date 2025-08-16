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

    // Generate mock crash reports for export (same as the main endpoint)
    const mockCrashes = [
      {
        id: 'crash-1',
        type: 'error',
        message: 'Database connection timeout',
        stackTrace: 'Error: Connection timeout\n    at Database.connect (/app/db.js:45:12)\n    at async function (/app/server.js:23:5)',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: 'user-123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url: '/dashboard/analytics',
        resolved: false,
        severity: 'high'
      },
      {
        id: 'crash-2',
        type: 'warning',
        message: 'Memory usage above threshold',
        stackTrace: 'Warning: Memory usage at 85%\n    at MemoryMonitor.check (/app/monitor.js:67:8)\n    at setInterval (/app/server.js:156:2)',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        userId: undefined,
        userAgent: 'System Monitor',
        url: '/system/monitor',
        resolved: true,
        severity: 'medium'
      },
      {
        id: 'crash-3',
        type: 'critical',
        message: 'Application crash during quiz submission',
        stackTrace: 'FATAL: Unhandled promise rejection\n    at QuizSubmission.process (/app/quiz.js:89:15)\n    at async function (/app/api/quiz/submit.js:34:7)',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        userId: 'user-456',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        url: '/dashboard/quizzes/123/submit',
        resolved: false,
        severity: 'critical'
      },
      {
        id: 'crash-4',
        type: 'error',
        message: 'File upload failed - disk space full',
        stackTrace: 'Error: ENOSPC: no space left on device\n    at WriteStream.write (/app/upload.js:23:12)\n    at async function (/app/api/upload.js:45:8)',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        userId: 'user-789',
        userAgent: 'Mozilla/5.0 (Linux x86_64) AppleWebKit/537.36',
        url: '/dashboard/assignments/upload',
        resolved: false,
        severity: 'high'
      },
      {
        id: 'crash-5',
        type: 'warning',
        message: 'Slow database query detected',
        stackTrace: 'Warning: Query took 2.5 seconds\n    at Database.query (/app/db.js:123:45)\n    at async function (/app/api/analytics.js:67:12)',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        userId: undefined,
        userAgent: 'Database Monitor',
        url: '/api/analytics',
        resolved: true,
        severity: 'low'
      }
    ]

    const exportData = {
      exportDate: new Date().toISOString(),
      totalCrashes: mockCrashes.length,
      resolvedCrashes: mockCrashes.filter(c => c.resolved).length,
      unresolvedCrashes: mockCrashes.filter(c => !c.resolved).length,
      crashes: mockCrashes
    }

    // Return as JSON file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="crash-reports-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Error exporting crash reports:', error)
    return NextResponse.json(
      { error: 'Failed to export crash reports' },
      { status: 500 }
    )
  }
}
