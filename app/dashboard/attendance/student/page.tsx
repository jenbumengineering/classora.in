'use client'

import { useState, useEffect } from 'react'
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
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

interface AttendanceSession {
  id: string
  date: string
  title?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NOT_MARKED'
  markedAt?: string
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

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (user) {
      loadEnrolledClasses()
    } else {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (selectedClassId) {
      loadAttendanceAnalytics()
    } else {
      setAnalytics(null)
    }
  }, [selectedClassId, currentMonth])

  const loadEnrolledClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
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
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAttendanceAnalytics = async () => {
    if (!selectedClassId) return

    try {
      const response = await fetch(`/api/attendance/analytics?classId=${selectedClassId}&period=90`, {
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
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'ABSENT':
        return <X className="w-4 h-4 text-red-600" />
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'EXCUSED':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />
      default:
        return <div className="w-4 h-4 bg-gray-200 rounded-full" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PRESENT: { color: 'bg-green-100 text-green-800', label: 'Present' },
      ABSENT: { color: 'bg-red-100 text-red-800', label: 'Absent' },
      LATE: { color: 'bg-yellow-100 text-yellow-800', label: 'Late' },
      EXCUSED: { color: 'bg-blue-100 text-blue-800', label: 'Excused' },
      NOT_MARKED: { color: 'bg-gray-100 text-gray-800', label: 'Not Marked' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NOT_MARKED
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const getAttendanceForDate = (date: Date) => {
    if (!analytics) return null
    
    const dateStr = date.toISOString().split('T')[0]
    return analytics.sessions.find(session => 
      new Date(session.date).toISOString().split('T')[0] === dateStr
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to view your attendance details.
            </p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (user.role !== 'STUDENT') {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page is only accessible to students.
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Back to Dashboard
            </Link>
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
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student - Attendance Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your attendance across all enrolled classes
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Class Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose a class to view your attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map((classData) => (
                <option key={classData.id} value={classData.id}>
                  {classData.code} - {classData.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedClassId && analytics && (
          <>
            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Present</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.present}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <X className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Absent</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.absent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Late</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.late}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.attendanceRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Attendance Calendar</CardTitle>
                    <CardDescription>View your attendance for {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prevMonth = new Date(currentMonth)
                        prevMonth.setMonth(prevMonth.getMonth() - 1)
                        setCurrentMonth(prevMonth)
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextMonth = new Date(currentMonth)
                        nextMonth.setMonth(nextMonth.getMonth() + 1)
                        setCurrentMonth(nextMonth)
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {generateCalendarDays().map((date, index) => {
                    const attendance = getAttendanceForDate(date)
                    const isCurrentMonthDay = isCurrentMonth(date)
                    const isTodayDate = isToday(date)
                    
                    return (
                      <div
                        key={index}
                        className={`
                          p-2 min-h-[60px] border border-gray-200 dark:border-gray-700
                          ${isCurrentMonthDay ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                          ${isTodayDate ? 'ring-2 ring-orange-500' : ''}
                        `}
                      >
                        <div className="text-sm text-gray-500 mb-1">
                          {date.getDate()}
                        </div>
                        {attendance && (
                          <div className="flex justify-center">
                            {getStatusIcon(attendance.status)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Records */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Detailed attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No attendance records found for this class.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Title</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Marked At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.sessions.map((session) => (
                          <tr key={session.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {new Date(session.date).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {session.title || 'No title'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(session.status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {session.markedAt ? new Date(session.markedAt).toLocaleString() : 'Not marked'}
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
