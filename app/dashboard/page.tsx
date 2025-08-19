'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { ProfessorDashboard } from '@/components/dashboard/ProfessorDashboard'
import { StudentDashboard } from '@/components/dashboard/StudentDashboard'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {user.role === 'PROFESSOR' ? (
          <ProfessorDashboard />
        ) : (
          <StudentDashboard />
        )}
      </div>
    </DashboardLayout>
  )
} 