'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function MaintenanceMode() {
  const { settings, loading } = useSettings()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return

    // If maintenance mode is enabled and user is not admin and not already on maintenance page
    if (settings?.maintenanceMode && user?.role !== 'ADMIN' && pathname !== '/maintenance') {
      router.push('/maintenance')
    }
    
    // If maintenance mode is disabled and user is on maintenance page, redirect to home
    if (!settings?.maintenanceMode && pathname === '/maintenance') {
      router.push('/')
    }
  }, [settings?.maintenanceMode, user?.role, loading, router, pathname])

  // This component no longer renders anything visible
  // It only handles redirects based on maintenance mode status
  return null
}
