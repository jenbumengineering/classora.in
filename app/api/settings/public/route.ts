import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
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
          emailFromName: 'Classora'
        }
      })
    }

    // Format settings for frontend - only include public settings
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      maintenanceMode: settings.maintenanceMode,
      registrationEnabled: settings.registrationEnabled,
      // Address fields (public)
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
      settings: publicSettings
    })

  } catch (error) {
    console.error('Error fetching public settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public settings' },
      { status: 500 }
    )
  }
}
