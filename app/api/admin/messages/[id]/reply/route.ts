import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply message is required'),
  adminName: z.string().optional()
})

export async function POST(
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
      select: { role: true, name: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const messageId = params.id
    const body = await request.json()
    const validatedData = replySchema.parse(body)

    // Get the original message
    const originalMessage = await prisma.contactMessage.findUnique({
      where: { id: messageId }
    })

    if (!originalMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Send reply email
    const emailResult = await sendEmail(originalMessage.email, 'contactReply', {
      userName: originalMessage.name,
      userEmail: originalMessage.email,
      originalSubject: originalMessage.subject,
      originalMessage: originalMessage.message,
      adminName: validatedData.adminName || user.name || 'Classora Support',
      replyMessage: validatedData.replyMessage
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send reply email' },
        { status: 500 }
      )
    }

    // Mark message as replied
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: { 
        read: true,
        // You could add a replied field to track if message was replied to
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending reply:', error)
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    )
  }
}
