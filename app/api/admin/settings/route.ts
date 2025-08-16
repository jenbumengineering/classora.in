import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const systemSettingsSchema = z.object({
  siteName: z.string().min(1),
  siteDescription: z.string(),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  maxFileSize: z.number().min(1).max(100),
  allowedFileTypes: z.union([z.string(), z.array(z.string())]),
  sessionTimeout: z.number().min(1).max(168), // 1 hour to 1 week
  backupRetention: z.number().min(1).max(365),
  emailHost: z.string().optional(),
  emailPort: z.number().optional(),
  emailSecure: z.boolean().optional(),
  emailFromEmail: z.string().email().optional(),
  emailFromName: z.string().optional(),
  emailSettings: z.object({
    host: z.string(),
    port: z.number(),
    secure: z.boolean(),
    fromEmail: z.string().email(),
    fromName: z.string()
  }).optional(),
  // Address fields
  companyName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional()
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Allow all authenticated users to read settings (for maintenance mode, etc.)
    // Only check if user exists, not if they're admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get settings from database or create default if none exist
    let settings = await prisma.systemSettings.findFirst()
    
    if (!settings) {
      // Create default settings
      settings = await prisma.systemSettings.create({
        data: {
          siteName: 'Classora.in',
          siteDescription: 'Educational Platform for Professors and Students',
          maintenanceMode: false,
          registrationEnabled: true,
          emailNotifications: true,
          maxFileSize: 10,
          allowedFileTypes: 'pdf,doc,docx,txt,jpg,jpeg,png',
          sessionTimeout: 24,
          backupRetention: 30,
          emailHost: 'mail.classora.in',
          emailPort: 587,
          emailSecure: false,
          emailFromEmail: 'support@classora.in',
          emailFromName: 'Classora',
          companyName: 'Jenbum Engineering Pvt. Ltd.',
          addressLine1: '123 Main Street',
          addressLine2: 'Suite 100',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          phone: '+91 1234567890',
          website: 'https://classora.in'
        }
      })
    }

    // Format settings for frontend
    const formattedSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      maintenanceMode: settings.maintenanceMode,
      registrationEnabled: settings.registrationEnabled,
      emailNotifications: settings.emailNotifications,
      maxFileSize: settings.maxFileSize,
      allowedFileTypes: settings.allowedFileTypes.split(','),
      sessionTimeout: settings.sessionTimeout,
      backupRetention: settings.backupRetention,
      emailSettings: {
        host: settings.emailHost,
        port: settings.emailPort,
        secure: settings.emailSecure,
        fromEmail: settings.emailFromEmail,
        fromName: settings.emailFromName
      },
      // Address fields
      companyName: settings.companyName,
      addressLine1: settings.addressLine1,
      addressLine2: settings.addressLine2,
      city: settings.city,
      state: settings.state,
      postalCode: settings.postalCode,
      country: settings.country,
      phone: settings.phone,
      website: settings.website
    }

    return NextResponse.json({
      settings: formattedSettings
    })

  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const validatedSettings = systemSettingsSchema.parse(body.settings)

    // Extract email settings from either flat fields or nested object
    const emailHost = validatedSettings.emailHost || validatedSettings.emailSettings?.host
    const emailPort = validatedSettings.emailPort || validatedSettings.emailSettings?.port
    const emailSecure = validatedSettings.emailSecure ?? validatedSettings.emailSettings?.secure
    const emailFromEmail = validatedSettings.emailFromEmail || validatedSettings.emailSettings?.fromEmail
    const emailFromName = validatedSettings.emailFromName || validatedSettings.emailSettings?.fromName

    // Get existing settings or create new ones
    let settings = await prisma.systemSettings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          siteName: validatedSettings.siteName,
          siteDescription: validatedSettings.siteDescription,
          maintenanceMode: validatedSettings.maintenanceMode,
          registrationEnabled: validatedSettings.registrationEnabled,
          emailNotifications: validatedSettings.emailNotifications,
          maxFileSize: validatedSettings.maxFileSize,
          allowedFileTypes: Array.isArray(validatedSettings.allowedFileTypes) 
            ? validatedSettings.allowedFileTypes.join(',') 
            : validatedSettings.allowedFileTypes,
          sessionTimeout: validatedSettings.sessionTimeout,
          backupRetention: validatedSettings.backupRetention,
          emailHost: emailHost,
          emailPort: emailPort,
          emailSecure: emailSecure,
          emailFromEmail: emailFromEmail,
          emailFromName: emailFromName,
          // Address fields
          companyName: validatedSettings.companyName,
          addressLine1: validatedSettings.addressLine1,
          addressLine2: validatedSettings.addressLine2,
          city: validatedSettings.city,
          state: validatedSettings.state,
          postalCode: validatedSettings.postalCode,
          country: validatedSettings.country,
          phone: validatedSettings.phone,
          website: validatedSettings.website
        }
      })
    } else {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: {
          siteName: validatedSettings.siteName,
          siteDescription: validatedSettings.siteDescription,
          maintenanceMode: validatedSettings.maintenanceMode,
          registrationEnabled: validatedSettings.registrationEnabled,
          emailNotifications: validatedSettings.emailNotifications,
          maxFileSize: validatedSettings.maxFileSize,
          allowedFileTypes: Array.isArray(validatedSettings.allowedFileTypes) 
            ? validatedSettings.allowedFileTypes.join(',') 
            : validatedSettings.allowedFileTypes,
          sessionTimeout: validatedSettings.sessionTimeout,
          backupRetention: validatedSettings.backupRetention,
          emailHost: emailHost,
          emailPort: emailPort,
          emailSecure: emailSecure,
          emailFromEmail: emailFromEmail,
          emailFromName: emailFromName,
          // Address fields
          companyName: validatedSettings.companyName,
          addressLine1: validatedSettings.addressLine1,
          addressLine2: validatedSettings.addressLine2,
          city: validatedSettings.city,
          state: validatedSettings.state,
          postalCode: validatedSettings.postalCode,
          country: validatedSettings.country,
          phone: validatedSettings.phone,
          website: validatedSettings.website
        }
      })
    }

    console.log('System settings updated:', settings)

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}
