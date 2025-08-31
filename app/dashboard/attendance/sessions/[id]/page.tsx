'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle, 
  Users,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface AttendanceSession {
  id: string
  classId: string
  professorId: string
  date: string
  title?: string
  description?: string
  isActive: boolean
  createdAt: string
  class: {
    id: string
    name: string
    code: string
  }
  records: AttendanceRecord[]
  _count: {
    records: number
  }
}

interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  markedAt: string
  notes?: string
  student: {
    id: string
    name: string
    email: string
  }
}

export default function AttendanceSessionPage() {
  const { user } = useAuth()
  const params = useParams()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (sessionId && user) {
      loadSession()
    }
  }, [sessionId, user])

  const loadSession = async () => {
    if (!sessionId || !user?.id) return

    try {
      console.log('🔄 Loading session:', sessionId)
      const response = await fetch(`/api/attendance?sessionId=${sessionId}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Session loaded:', data.session)
        setSession(data.session)
      } else {
        console.error('❌ Failed to load session:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        toast.error('Failed to load attendance session')
      }
    } catch (error) {
      console.error('Error loading session:', error)
      toast.error('Failed to load attendance session')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'ABSENT':
        return <X className="w-4 h-4 text-red-600" />
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'EXCUSED':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PRESENT: { color: 'bg-green-100 text-green-800', label: 'Present' },
      ABSENT: { color: 'bg-red-100 text-red-800', label: 'Absent' },
      LATE: { color: 'bg-yellow-100 text-yellow-800', label: 'Late' },
      EXCUSED: { color: 'bg-blue-100 text-blue-800', label: 'Excused' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ABSENT
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Session Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The attendance session you're looking for doesn't exist or you don't have access to it.</p>
            <Button asChild>
              <Link href="/dashboard/attendance">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Attendance
              </Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Button asChild variant="ghost" size="sm" className="mr-4">
                <Link href="/dashboard/attendance">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Attendance
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Session</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {session.class.name} - {new Date(session.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/attendance/sessions/${session.id}/mark`}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Attendance
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/attendance/sessions/${session.id}/analytics`}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Session Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Information about this attendance session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Session Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Date: {new Date(session.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Title: {session.title || 'No title'}</span>
                  </div>
                  {session.description && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Description: {session.description}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status: {session.isActive ? 'Active' : 'Closed'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Class Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Class: {session.class.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Code: {session.class.code}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Total Records: {session._count.records}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              {session.records.length} student{session.records.length !== 1 ? 's' : ''} marked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session.records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No attendance records yet. Mark attendance to see student records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Marked At</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.records.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {record.student.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {record.student.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(record.status)}
                            <span className="ml-2">{getStatusBadge(record.status)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(record.markedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {record.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
