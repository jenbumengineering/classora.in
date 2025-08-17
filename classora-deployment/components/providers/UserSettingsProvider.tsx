'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    assignments: boolean
    quizzes: boolean
    announcements: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'classmates'
    showEmail: boolean
    showPhone: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: 'small' | 'medium' | 'large'
  }
}

interface UserSettingsContextType {
  settings: UserSettings | null
  loading: boolean
  updateSettings: (newSettings: UserSettings) => Promise<void>
  applyTheme: (theme: string) => void
  applyFontSize: (fontSize: string) => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      setSettings(null)
      setLoading(false)
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/settings', {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        applySettings(data)
      } else {
        // Use default settings if API fails
        const defaultSettings: UserSettings = {
          notifications: {
            email: true,
            push: true,
            assignments: true,
            quizzes: true,
            announcements: true
          },
          privacy: {
            profileVisibility: 'classmates' as const,
            showEmail: false,
            showPhone: false
          },
          appearance: {
            theme: 'light' as const,
            fontSize: 'medium' as const
          }
        }
        setSettings(defaultSettings)
        applySettings(defaultSettings)
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      // Use default settings on error
      const defaultSettings: UserSettings = {
        notifications: {
          email: true,
          push: true,
          assignments: true,
          quizzes: true,
          announcements: true
        },
        privacy: {
          profileVisibility: 'classmates' as const,
          showEmail: false,
          showPhone: false
        },
        appearance: {
          theme: 'light' as const,
          fontSize: 'medium' as const
        }
      }
      setSettings(defaultSettings)
      applySettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const applySettings = (userSettings: UserSettings) => {
    // Apply theme
    applyTheme(userSettings.appearance.theme)
    
    // Apply font size
    applyFontSize(userSettings.appearance.fontSize)
  }

  const applyTheme = (theme: string) => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
    
    // Store theme preference
    localStorage.setItem('theme', theme)
  }

  const applyFontSize = (fontSize: string) => {
    const root = document.documentElement
    
    // Remove existing font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    
    // Apply font size class
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      default:
        root.classList.add('text-base')
        break
    }
    
    // Store font size preference
    localStorage.setItem('fontSize', fontSize)
  }

  const updateSettings = async (newSettings: UserSettings) => {
    if (!user) return

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        applySettings(data)
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating user settings:', error)
      throw error
    }
  }

  // Initialize theme and font size from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    const savedFontSize = localStorage.getItem('fontSize') || 'medium'
    
    applyTheme(savedTheme)
    applyFontSize(savedFontSize)
  }, [])

  const value: UserSettingsContextType = {
    settings,
    loading,
    updateSettings,
    applyTheme,
    applyFontSize
  }

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}
