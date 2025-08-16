'use client'

import { useSettings } from '@/components/providers/SettingsProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Wrench, Clock, Mail, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function MaintenancePage() {
  const { settings, loading } = useSettings()
  const { user } = useAuth()
  const router = useRouter()

  // If not in maintenance mode, redirect to home
  useEffect(() => {
    if (!loading && !settings?.maintenanceMode) {
      router.push('/')
    }
  }, [settings?.maintenanceMode, loading, router])

  // Show loading while checking settings
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not in maintenance mode, show redirecting message
  if (!settings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // If user is admin, show admin bypass message
  if (user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 p-6 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Maintenance Mode Active</h1>
          <p className="text-gray-600 mb-6">
            Maintenance mode is currently enabled. As an admin, you can still access the site.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-yellow-100 p-6 rounded-full">
              <Wrench className="w-16 h-16 text-yellow-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            We're Under Maintenance
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {settings?.siteName || 'Classora.in'} is currently undergoing scheduled maintenance to improve your experience. 
            We'll be back shortly with enhanced features and better performance.
          </p>

          {/* Status Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Estimated Time</h3>
              <p className="text-gray-600">2-4 hours</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's Happening</h3>
              <p className="text-gray-600">System updates & improvements</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Updates</h3>
              <p className="text-gray-600">We'll notify you when we're back</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-lg p-8 shadow-sm border max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-6">
              If you have urgent questions or need assistance, please don't hesitate to reach out to our support team.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 mr-3" />
                <a 
                  href="mailto:support@classora.in" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  support@classora.in
                </a>
              </div>
              
              <div className="text-sm text-gray-500">
                We typically respond within 1-2 hours during business hours.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              Thank you for your patience. We're working hard to bring you a better experience.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              © 2025 {settings?.siteName || 'Classora.in'}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
