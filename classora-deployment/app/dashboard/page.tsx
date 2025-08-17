'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { ProfessorDashboard } from '@/components/dashboard/ProfessorDashboard'
import { StudentDashboard } from '@/components/dashboard/StudentDashboard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.role === 'PROFESSOR' ? (
        <ProfessorDashboard />
      ) : (
        <StudentDashboard />
      )}
    </div>
  )
} 