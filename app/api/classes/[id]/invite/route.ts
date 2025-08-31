import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendClassInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const classId = params.id
    const { emails } = await request.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Email addresses required' }, { status: 400 })
    }

    // Verify the user is a professor and owns this class
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { professorId: true, name: true, code: true }
    })

    if (!classData || classData.professorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Filter out invalid emails
    const validEmails = emails.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email.trim())
    })

    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided' }, { status: 400 })
    }

    // Check for existing users with these emails to avoid duplicates
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: validEmails }
      },
      select: { email: true }
    })

    const existingEmails = existingUsers.map(u => u.email)
    const newEmails = validEmails.filter(email => !existingEmails.includes(email))

    if (newEmails.length === 0) {
      return NextResponse.json({ error: 'All email addresses are already registered' }, { status: 400 })
    }

    // Determine the base URL for the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://classora.in' : 'http://localhost:3000')

    const invitationResults = []

    // Process each email
    for (const email of newEmails) {
      try {
        // Check if invitation already exists for this email and class
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            email: email,
            classId: classId
          }
        })

        if (existingInvitation) {
          // Update existing invitation if it's expired
          if (new Date() > existingInvitation.expiresAt) {
            const newToken = crypto.randomBytes(32).toString('hex')
            const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

            await prisma.invitation.update({
              where: { id: existingInvitation.id },
              data: {
                token: newToken,
                expiresAt: newExpiresAt,
                status: 'PENDING'
              }
            })

            const invitationUrl = `${baseUrl}/invitations/accept?token=${newToken}`
            const expiresAt = newExpiresAt.toLocaleDateString()

            // Send invitation email
            const emailResult = await sendClassInvitationEmail({
              studentEmail: email,
              className: classData.name,
              professorName: user.name,
              invitationUrl: invitationUrl,
              expiresAt: expiresAt
            })

            if (emailResult.success) {
              invitationResults.push({
                email,
                status: 'invited',
                message: 'Invitation sent successfully (updated)'
              })
            } else {
              invitationResults.push({
                email,
                status: 'error',
                message: `Failed to send email: ${emailResult.error}`
              })
            }
          } else {
            invitationResults.push({
              email,
              status: 'already_invited',
              message: 'Invitation already exists and is still valid'
            })
          }
        } else {
          // Create new invitation
          const token = crypto.randomBytes(32).toString('hex')
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

          const invitation = await prisma.invitation.create({
            data: {
              email: email,
              classId: classId,
              professorId: userId,
              token: token,
              expiresAt: expiresAt
            }
          })

          const invitationUrl = `${baseUrl}/invitations/accept?token=${token}`
          const expiresAtFormatted = expiresAt.toLocaleDateString()

          // Send invitation email
          const emailResult = await sendClassInvitationEmail({
            studentEmail: email,
            className: classData.name,
            professorName: user.name,
            invitationUrl: invitationUrl,
            expiresAt: expiresAtFormatted
          })

          if (emailResult.success) {
            invitationResults.push({
              email,
              status: 'invited',
              message: 'Invitation sent successfully'
            })
          } else {
            invitationResults.push({
              email,
              status: 'error',
              message: `Failed to send email: ${emailResult.error}`
            })
          }
        }
      } catch (error) {
        console.error(`Error processing invitation for ${email}:`, error)
        invitationResults.push({
          email,
          status: 'error',
          message: 'Failed to send invitation'
        })
      }
    }

    const successful = invitationResults.filter(r => r.status === 'invited')
    const failed = invitationResults.filter(r => r.status === 'error')

    return NextResponse.json({
      message: `Successfully sent ${successful.length} invitations`,
      sent: successful.length,
      failed: failed.length,
      results: invitationResults
    })
  } catch (error) {
    console.error('Error sending invitations:', error)
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    )
  }
}
