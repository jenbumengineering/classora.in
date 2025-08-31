'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  BarChart3,
  ChevronLeft,
  User,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AttendanceSession {
  id: string
  date: string
  title?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NOT_MARKED'
  markedAt?: string
  reason?: string
}

interface AttendanceAnalytics {
  totalSessions: number
  present: number
  absent: number
  late: number
  excused: number
  notMarked: number
  attendanceRate: string
  sessions: AttendanceSession[]
}

export default function StudentAttendanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const studentId = params.studentId as string
  const [student, setStudent] = useState<Student | null>(null)
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    if (user && studentId) {
      loadStudentData()
      loadProfessorClasses()
    }
  }, [user, studentId])

  useEffect(() => {
    if (selectedClassId) {
      loadAttendanceAnalytics()
    }
  }, [selectedClassId])

  const loadStudentData = async () => {
    try {
      const response = await fetch(`/api/dashboard/students/${studentId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStudent({
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar
        })
      }
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Failed to load student data')
    }
  }

  const loadProfessorClasses = async () => {
    try {
      const response = await fetch(`/api/classes?professorId=${user?.id}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        if (data.classes && data.classes.length > 0) {
          setSelectedClassId(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAttendanceAnalytics = async () => {
    if (!selectedClassId) return

    try {
      const response = await fetch(`/api/attendance/analytics?classId=${selectedClassId}&studentId=${studentId}&period=90`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error loading attendance analytics:', error)
      toast.error('Failed to load attendance data')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ABSENT':
        return <X className="w-4 h-4 text-red-500" />
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'EXCUSED':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'ABSENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (user?.role !== 'PROFESSOR') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only professors can view student attendance details.</p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {student?.name || 'Student'} - Attendance Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {student?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose a class to view attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} - {cls.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {analytics && (
          <>
            {/* Attendance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {analytics.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {analytics.present}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Present</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                      {analytics.absent}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Absent</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                      {analytics.late}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Late</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Sessions</CardTitle>
                <CardDescription>
                  Detailed attendance record for the selected class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(session.status)}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {session.title || 'Attendance Session'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(session.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                          {session.status.replace('_', ' ')}
                        </span>
                        {session.markedAt && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(session.markedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
