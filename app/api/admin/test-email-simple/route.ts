import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user-id')?.value
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, name: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { recipientEmail } = body

    const testRecipient = recipientEmail || user.email

    // Test multiple configurations
    const configs = [
      {
        name: 'VPS Mail Server with SMTP Auth (173.249.24.112:587)',
        config: {
          host: '173.249.24.112',
          port: 587,
          secure: false,
          auth: {
            user: 'smtp-auth@classora.in',
            pass: 'ClassoraSMTP2024!'
          },
          tls: {
            rejectUnauthorized: false
          },
          requireTLS: false,
          ignoreTLS: false
        }
      },
      {
        name: 'VPS Mail Server (173.249.24.112:25)',
        config: {
          host: '173.249.24.112',
          port: 25,
          secure: false,
          auth: {
            user: 'classora-noreply',
            pass: 'Classora2024!'
          },
          tls: {
            rejectUnauthorized: false
          },
          requireTLS: false,
          ignoreTLS: true
        }
      },
      {
        name: 'Legacy Config (mail.classora.in:587)',
        config: {
          host: 'mail.classora.in',
          port: 587,
          secure: false,
          auth: {
            user: 'support@classora.in',
            pass: 'Unbreakable@7001'
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    ]

    const results = []

    for (const config of configs) {
      try {
        console.log(`Testing configuration: ${config.name}`)
        
        const transporter = nodemailer.createTransport(config.config)
        
        // Test connection
        await transporter.verify()
        console.log(`✓ Connection successful for ${config.name}`)
        
        // Send test email
        const info = await transporter.sendMail({
          from: '"Classora" <noreply@classora.in>',
          to: testRecipient,
          subject: `Test Email - ${config.name}`,
          text: `This is a test email from ${config.name} at ${new Date().toISOString()}`,
          html: `
            <h2>Test Email</h2>
            <p>This is a test email from <strong>${config.name}</strong></p>
            <p>Sent at: ${new Date().toISOString()}</p>
            <p>If you receive this email, the configuration is working!</p>
          `
        })
        
        console.log(`✓ Email sent successfully for ${config.name}:`, info.messageId)
        
        results.push({
          config: config.name,
          success: true,
          messageId: info.messageId,
          response: info
        })
        
      } catch (error) {
        console.error(`✗ Failed for ${config.name}:`, error)
        results.push({
          config: config.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error
        })
      }
    }

    const successfulConfigs = results.filter(r => r.success)
    
    if (successfulConfigs.length > 0) {
      return NextResponse.json({
        success: true,
        message: `${successfulConfigs.length} configuration(s) worked successfully`,
        results: results,
        workingConfigs: successfulConfigs
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'All configurations failed',
        results: results
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { error: 'Internal server error during email test' },
      { status: 500 }
    )
  }
}
