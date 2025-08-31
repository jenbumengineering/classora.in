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
  ArrowLeft,
  BarChart3,
  PieChart
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

interface SessionAnalytics {
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: string
  records: AttendanceRecord[]
}

export default function AttendanceSessionAnalyticsPage() {
  const { user } = useAuth()
  const params = useParams()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
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
        
        // Calculate analytics
        const records = data.session.records || []
        const totalStudents = records.length
        const present = records.filter((r: AttendanceRecord) => r.status === 'PRESENT').length
        const absent = records.filter((r: AttendanceRecord) => r.status === 'ABSENT').length
        const late = records.filter((r: AttendanceRecord) => r.status === 'LATE').length
        const excused = records.filter((r: AttendanceRecord) => r.status === 'EXCUSED').length
        
        const attendanceRate = totalStudents > 0 
          ? `${Math.round(((present + late + excused) / totalStudents) * 100)}%`
          : '0%'
        
        setAnalytics({
          totalStudents,
          present,
          absent,
          late,
          excused,
          attendanceRate,
          records
        })
      } else {
        console.error('❌ Failed to load session:', response.status, response.statusText)
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
                <Link href={`/dashboard/attendance/sessions/${session.id}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Session
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {session.class.name} - {new Date(session.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Session Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Details about this attendance session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Class</span>
                <p className="text-gray-900 dark:text-white">{session.class.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</span>
                <p className="text-gray-900 dark:text-white">{new Date(session.date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                <p className="text-gray-900 dark:text-white">{session.isActive ? 'Active' : 'Closed'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.present}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <X className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.attendanceRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Statistics */}
        {analytics && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>Breakdown of attendance by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{analytics.present}</p>
                  <p className="text-sm text-green-600">Present</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalStudents > 0 ? Math.round((analytics.present / analytics.totalStudents) * 100) : 0}%
                  </p>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <X className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{analytics.absent}</p>
                  <p className="text-sm text-red-600">Absent</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalStudents > 0 ? Math.round((analytics.absent / analytics.totalStudents) * 100) : 0}%
                  </p>
                </div>

                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{analytics.late}</p>
                  <p className="text-sm text-yellow-600">Late</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalStudents > 0 ? Math.round((analytics.late / analytics.totalStudents) * 100) : 0}%
                  </p>
                </div>

                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{analytics.excused}</p>
                  <p className="text-sm text-blue-600">Excused</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalStudents > 0 ? Math.round((analytics.excused / analytics.totalStudents) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Detailed list of all attendance records for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No attendance records found for this session.</p>
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
                    {analytics?.records.map((record) => (
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
