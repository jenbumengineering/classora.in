import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

const prisma = new PrismaClient()

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    })
    
    // Determine the base URL for the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://classora.in' : 'http://localhost:3000')
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    // Send password reset email using the dedicated function
    const emailResult = await sendPasswordResetEmail({
      userName: user.name,
      userEmail: user.email,
      resetToken: resetToken,
      resetUrl: resetUrl
    })

    if (emailResult.success) {
      console.log('✅ Password reset email sent successfully to:', user.email)
    } else {
      console.error('❌ Failed to send password reset email:', emailResult.error)
      // Don't fail the request if email fails, just log the error
    }
    
    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      )
    }
    
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
