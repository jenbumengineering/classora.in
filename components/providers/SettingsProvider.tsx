'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  maxFileSize: number
  allowedFileTypes: string[]
  sessionTimeout: number
  backupRetention: number
  emailSettings: {
    host: string
    port: number
    secure: boolean
    fromEmail: string
    fromName: string
  }
}

interface SettingsContextType {
  settings: SystemSettings
  loading: boolean
  refreshSettings: () => Promise<void>
  updateSettings: (newSettings: SystemSettings) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  // Initialize with default settings immediately
  const defaultSettings = {
    siteName: 'Classora.in',
    siteDescription: 'Educational Platform for Professors and Students',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
    sessionTimeout: 24,
    backupRetention: 30,
    emailSettings: {
      host: 'mail.classora.in',
      port: 587,
      secure: false,
      fromEmail: 'support@classora.in',
      fromName: 'Classora'
    }
  }

  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)

  // Fetch settings from API - use different endpoints for admin vs non-admin users
  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      let response
      if (user?.role === 'ADMIN') {
        // Admin users get full settings
        response = await fetch('/api/admin/settings', {
          headers: { 'x-user-id': user.id }
        })
      } else {
        // Non-admin users get public settings
        response = await fetch('/api/settings/public')
      }
      
      if (response.ok) {
        const data = await response.json()
        // Merge with default settings to ensure all fields are present
        setSettings({
          ...defaultSettings,
          ...data.settings
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch settings on mount and when user changes
  useEffect(() => {
    fetchSettings()
  }, [user?.id, user?.role])

  const refreshSettings = async () => {
    await fetchSettings()
  }

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings)
  }

  const value = {
    settings,
    loading,
    refreshSettings,
    updateSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
