import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    assignments: z.boolean(),
    quizzes: z.boolean(),
    announcements: z.boolean()
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'classmates']),
    showEmail: z.boolean(),
    showPhone: z.boolean()
  }),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    fontSize: z.enum(['small', 'medium', 'large'])
  })
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings from database
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    if (!userSettings) {
      // Return default settings if no settings exist
      const defaultSettings = {
        notifications: {
          email: true,
          push: true,
          assignments: true,
          quizzes: true,
          announcements: true
        },
        privacy: {
          profileVisibility: 'classmates',
          showEmail: false,
          showPhone: false
        },
        appearance: {
          theme: 'light',
          fontSize: 'medium'
        }
      }
      return NextResponse.json(defaultSettings)
    }

    // Parse JSON strings to objects
    const settings = {
      notifications: JSON.parse(userSettings.notifications),
      privacy: JSON.parse(userSettings.privacy),
      appearance: JSON.parse(userSettings.appearance)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedSettings = userSettingsSchema.parse(body)

    // Update or create user settings in database
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        notifications: JSON.stringify(validatedSettings.notifications),
        privacy: JSON.stringify(validatedSettings.privacy),
        appearance: JSON.stringify(validatedSettings.appearance)
      },
      create: {
        userId,
        notifications: JSON.stringify(validatedSettings.notifications),
        privacy: JSON.stringify(validatedSettings.privacy),
        appearance: JSON.stringify(validatedSettings.appearance)
      }
    })

    // Return the parsed settings
    const settings = {
      notifications: JSON.parse(updatedSettings.notifications),
      privacy: JSON.parse(updatedSettings.privacy),
      appearance: JSON.parse(updatedSettings.appearance)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating user settings:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid settings data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
