import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Check if session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        records: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete all attendance records for this session first (due to foreign key constraints)
    await prisma.attendanceRecord.deleteMany({
      where: { sessionId }
    })

    // Delete the session
    await prisma.attendanceSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })

  } catch (error) {
    console.error('Error deleting attendance session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
