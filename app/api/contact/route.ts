import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendContactFormEmail } from '@/lib/email'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters long')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // Save the message to the database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        read: false
      }
    })

    console.log('Contact form submission saved:', contactMessage)

    // Send email notification to admin in background
    sendContactFormEmail({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message
    }).then((emailResult) => {
      if (emailResult.success) {
        console.log('Contact form email sent successfully')
      } else {
        console.error('Failed to send contact form email:', emailResult.error)
      }
    }).catch((emailError) => {
      console.error('Error sending contact form email:', emailError)
      // Don't fail the request if email fails, just log the error
    })

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.'
    })

  } catch (error) {
    console.error('Contact form error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid form data',
          errors: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while sending your message. Please try again.'
      },
      { status: 500 }
    )
  }
}
