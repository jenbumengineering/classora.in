import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendClassInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

const inviteStudentsSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
  forceResend: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Invitation API called')
    const professorId = request.headers.get('x-user-id')
    
    if (!professorId) {
      console.log('❌ No professor ID provided')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('👤 Professor ID:', professorId)

    // Verify user is a professor
    const user = await prisma.user.findUnique({
      where: { id: professorId }
    })

    if (!user || user.role !== 'PROFESSOR') {
      return NextResponse.json(
        { error: 'Access denied. Professor role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
                console.log('📨 Request body:', body)
            const validatedData = inviteStudentsSchema.parse(body)
            console.log('✅ Validated data:', validatedData)
            if (validatedData.forceResend) {
              console.log('🔄 Force resend mode enabled')
            }

    // Verify the class belongs to the professor
    const classData = await prisma.class.findFirst({
      where: {
        id: validatedData.classId,
        professorId: professorId
      }
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Determine the base URL for the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://classora.in' : 'http://localhost:3000')

    const invitationResults = []

    // Process each email
    for (const email of validatedData.emails) {
      try {
        // Check if invitation already exists for this email and class
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            email: email,
            classId: validatedData.classId
          }
        })

        if (existingInvitation) {
          // Update existing invitation if it's expired or forceResend is true
          if (new Date() > existingInvitation.expiresAt || validatedData.forceResend) {
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

            // Send invitation email in background
            sendClassInvitationEmail({
              studentEmail: email,
              className: classData.name,
              professorName: user.name,
              invitationUrl: invitationUrl,
              expiresAt: expiresAt
            }).then((emailResult) => {
              if (emailResult.success) {
                console.log(`✅ Invitation email sent successfully to: ${email}`)
                invitationResults.push({
                  email,
                  status: 'invited',
                  message: validatedData.forceResend ? 'Invitation resent successfully' : 'Invitation sent successfully (updated)'
                })
              } else {
                console.error(`❌ Failed to send invitation email to ${email}:`, emailResult.error)
                invitationResults.push({
                  email,
                  status: 'error',
                  message: `Failed to send email: ${emailResult.error}`
                })
              }
            }).catch((emailError) => {
              console.error(`❌ Error sending invitation email to ${email}:`, emailError)
              invitationResults.push({
                email,
                status: 'error',
                message: `Email error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
              })
            })
                            } else {
                    console.log(`ℹ️ Invitation already exists and is still valid for: ${email}`)
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
              classId: validatedData.classId,
              professorId: professorId,
              token: token,
              expiresAt: expiresAt
            }
          })

          const invitationUrl = `${baseUrl}/invitations/accept?token=${token}`
          const expiresAtFormatted = expiresAt.toLocaleDateString()

          // Send invitation email in background
          sendClassInvitationEmail({
            studentEmail: email,
            className: classData.name,
            professorName: user.name,
            invitationUrl: invitationUrl,
            expiresAt: expiresAtFormatted
          }).then((emailResult) => {
            if (emailResult.success) {
              console.log(`✅ Invitation email sent successfully to: ${email}`)
              invitationResults.push({
                email,
                status: 'invited',
                message: 'Invitation sent successfully'
              })
            } else {
              console.error(`❌ Failed to send invitation email to ${email}:`, emailResult.error)
              invitationResults.push({
                email,
                status: 'error',
                message: `Failed to send email: ${emailResult.error}`
              })
            }
          }).catch((emailError) => {
            console.error(`❌ Error sending invitation email to ${email}:`, emailError)
            invitationResults.push({
              email,
              status: 'error',
              message: `Email error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
            })
          })
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

    console.log('📊 Final invitation results:', invitationResults)
    const response = {
      success: true,
      message: `Invitations sent to ${validatedData.emails.length} students`,
      results: invitationResults,
      classId: validatedData.classId,
      className: classData.name
    }
    console.log('📤 Sending response:', response)
    return NextResponse.json(response)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
