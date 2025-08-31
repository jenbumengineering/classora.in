'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Users, 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle, 
  Minus,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Printer
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

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
  _count: {
    records: number
  }
}

interface Student {
  id: string
  name: string
  email: string
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

interface AttendanceReport {
  studentId: string
  studentName: string
  studentEmail: string
  totalSessions: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
  sessions: Array<{
    date: string
    title?: string
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NOT_MARKED'
  }>
}

export default function AttendancePage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [activeTab, setActiveTab] = useState<'sessions' | 'reports'>('sessions')
  const [reports, setReports] = useState<AttendanceReport[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  const [reportFilters, setReportFilters] = useState({
    period: 'month' as 'daily' | 'weekly' | 'monthly' | 'custom',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeNotMarked: false
  })

  useEffect(() => {
    console.log('👤 User state changed:', user ? `${user.name} (${user.role})` : 'No user')
    if (user) {
      loadClasses()
    }
  }, [user])

  useEffect(() => {
    console.log('📚 Selected class changed:', selectedClassId)
    if (selectedClassId) {
      if (activeTab === 'sessions') {
        loadSessions()
      } else if (activeTab === 'reports') {
        loadAttendanceReports()
      }
    } else {
      setSessions([])
      setReports([])
    }
  }, [selectedClassId, activeTab])

  useEffect(() => {
    if (activeTab === 'reports' && selectedClassId) {
      loadAttendanceReports()
    }
  }, [reportFilters])

  const loadClasses = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available, skipping class load')
      return
    }
    
    try {
      console.log('🔄 Loading classes for professor:', user.id)
      const response = await fetch(`/api/classes?professorId=${user.id}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📚 Classes loaded:', data.classes?.length || 0, 'classes')
        setClasses(data.classes || [])
        if (data.classes && data.classes.length > 0) {
          setSelectedClassId(data.classes[0].id)
        }
      } else {
        console.error('❌ Failed to load classes:', response.status, response.statusText)
        toast.error('Failed to load classes')
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessions = async () => {
    if (!selectedClassId) return
    if (!user?.id) {
      console.log('❌ No user ID available, skipping session load')
      return
    }

    try {
      console.log('🔄 Loading sessions for class:', selectedClassId)
      const response = await fetch(`/api/attendance?classId=${selectedClassId}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Sessions loaded:', data.sessions?.length || 0, 'sessions')
        setSessions(data.sessions || [])
      } else {
        console.error('❌ Failed to load sessions:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        toast.error('Failed to load attendance sessions')
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast.error('Failed to load attendance sessions')
    }
  }

  const loadAttendanceReports = async () => {
    if (!selectedClassId) return
    if (!user?.id) return

    setIsLoadingReports(true)
    try {
      const params = new URLSearchParams({
        classId: selectedClassId,
        period: reportFilters.period,
        startDate: reportFilters.startDate,
        endDate: reportFilters.endDate,
        includeNotMarked: reportFilters.includeNotMarked.toString()
      })

      const response = await fetch(`/api/attendance/reports?${params}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        console.error('Failed to load reports:', response.status)
        toast.error('Failed to load attendance reports')
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load attendance reports')
    } finally {
      setIsLoadingReports(false)
    }
  }

  const exportToXLSX = () => {
    if (reports.length === 0) {
      toast.error('No data to export')
      return
    }

    console.log('📊 Starting XLSX export with', reports.length, 'reports')
    setIsExporting(true)
    try {
      // Get selected class info
      const selectedClass = classes.find(c => c.id === selectedClassId)
      const className = selectedClass ? `${selectedClass.code} - ${selectedClass.name}` : 'Unknown Class'

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Prepare summary data for export
      const summaryData = reports.map(report => ({
        'Student Name': report.studentName,
        'Student Email': report.studentEmail,
        'Total Sessions': report.totalSessions,
        'Present': report.present,
        'Absent': report.absent,
        'Late': report.late,
        'Excused': report.excused,
        'Not Marked': report.notMarked || 0,
        'Attendance Rate (%)': report.attendanceRate.toFixed(1)
      }))

      // Create summary worksheet
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      
      // Set column widths for summary
      const summaryColWidths = [
        { wch: 20 }, // Student Name
        { wch: 25 }, // Student Email
        { wch: 15 }, // Total Sessions
        { wch: 10 }, // Present
        { wch: 10 }, // Absent
        { wch: 10 }, // Late
        { wch: 10 }, // Excused
        { wch: 12 }, // Not Marked
        { wch: 18 }  // Attendance Rate
      ]
      summaryWs['!cols'] = summaryColWidths

      // Add summary worksheet
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // Create detailed session data
      const detailedData = []
      reports.forEach(report => {
        if (report.sessions && Array.isArray(report.sessions)) {
          report.sessions.forEach(session => {
            detailedData.push({
              'Student Name': report.studentName,
              'Student Email': report.studentEmail,
              'Date': session.date,
              'Session Title': session.title || 'No Title',
              'Status': session.status
            })
          })
        }
      })

      // Create detailed worksheet
      const detailedWs = XLSX.utils.json_to_sheet(detailedData)
      
      // Set column widths for detailed
      const detailedColWidths = [
        { wch: 20 }, // Student Name
        { wch: 25 }, // Student Email
        { wch: 15 }, // Date
        { wch: 25 }, // Session Title
        { wch: 15 }  // Status
      ]
      detailedWs['!cols'] = detailedColWidths

      // Add detailed worksheet
      XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Sessions')

      // Add charts worksheet
      {
        // Calculate totals for charts
        const totalPresent = reports.reduce((sum, report) => sum + report.present, 0)
        const totalAbsent = reports.reduce((sum, report) => sum + report.absent, 0)
        const totalLate = reports.reduce((sum, report) => sum + report.late, 0)
        const totalExcused = reports.reduce((sum, report) => sum + report.excused, 0)
        
        console.log('📊 Chart data:', { totalPresent, totalAbsent, totalLate, totalExcused })

        // Prepare chart data
        const chartData = [
          ['Category', 'Count'],
          ['Present', totalPresent],
          ['Absent', totalAbsent],
          ['Late', totalLate],
          ['Excused', totalExcused]
        ]

        const chartWs = XLSX.utils.aoa_to_sheet(chartData)
        chartWs['!cols'] = [{ wch: 15 }, { wch: 10 }]
        XLSX.utils.book_append_sheet(wb, chartWs, 'Chart Data')

        // Add attendance rate distribution
        const rateData = [
          ['Student', 'Attendance Rate (%)'],
          ...reports.map(report => [report.studentName, report.attendanceRate])
        ]

        const rateWs = XLSX.utils.aoa_to_sheet(rateData)
        rateWs['!cols'] = [{ wch: 25 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, rateWs, 'Attendance Rates')

        // Add a pie chart to the summary worksheet
        if (chartData.length > 1 && (totalPresent > 0 || totalAbsent > 0 || totalLate > 0 || totalExcused > 0)) {
          const pieChart = {
            type: 'pie',
            title: { name: 'Attendance Distribution' },
            series: [
              {
                name: 'Attendance',
                categories: chartData.slice(1).map(row => row[0]),
                values: chartData.slice(1).map(row => row[1])
              }
            ]
          }
          
          // Add chart to summary worksheet
          if (!summaryWs['!charts']) summaryWs['!charts'] = []
          summaryWs['!charts'].push(pieChart)
          console.log('📊 Added pie chart to XLSX')
        } else {
          console.log('📊 No chart data available or all values are zero')
        }
      }

      // Generate filename
      const periodText = reportFilters.period.charAt(0).toUpperCase() + reportFilters.period.slice(1)
      const filename = `Attendance_Report_${className.replace(/[^a-zA-Z0-9]/g, '_')}_${periodText}_${reportFilters.startDate}_to_${reportFilters.endDate}.xlsx`

      // Save file
      console.log('📊 Saving XLSX file:', filename)
      XLSX.writeFile(wb, filename)
      toast.success('XLSX file exported successfully!')
    } catch (error) {
      console.error('Error exporting to XLSX:', error)
      toast.error('Failed to export XLSX file')
    } finally {
      setIsExporting(false)
    }
  }





  const handleCreateSession = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }
    
    if (!selectedClassId) {
      toast.error('Please select a class')
      return
    }

    if (!sessionForm.date) {
      toast.error('Please select a date')
      return
    }

    setIsCreatingSession(true)
    try {
      console.log('📝 Creating session with data:', {
        classId: selectedClassId,
        date: sessionForm.date,
        title: sessionForm.title,
        description: sessionForm.description
      })
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          classId: selectedClassId,
          date: sessionForm.date,
          title: sessionForm.title,
          description: sessionForm.description
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Session created successfully:', data.session)
        // Refresh the sessions list instead of manually adding to state
        await loadSessions()
        setSessionForm({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        toast.success('Attendance session created successfully')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create session')
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    // Find the session to show more details in confirmation
    const session = sessions.find(s => s.id === sessionId)
    const sessionInfo = session ? `${session.title || 'Untitled'} (${new Date(session.date).toLocaleDateString()})` : 'this session'
    
    if (!confirm(`Are you sure you want to delete ${sessionInfo}?\n\nThis action will:\n• Delete the attendance session\n• Delete all attendance records for this session\n• Cannot be undone\n\nClick OK to proceed or Cancel to abort.`)) {
      return
    }

    setDeletingSessionId(sessionId)
    try {
      console.log('🗑️ Deleting session:', sessionId)
      
      const response = await fetch(`/api/attendance/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        console.log('✅ Session deleted successfully')
        // Refresh the sessions list
        await loadSessions()
        toast.success('Attendance session deleted successfully')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete session')
    } finally {
      setDeletingSessionId(null)
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
        return <Minus className="w-4 h-4 text-gray-400" />
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

  return (
    <DashboardLayout>
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create attendance sessions and track student attendance
            </p>
          </div>
          {selectedClassId && (
            <Button asChild>
              <Link href={`/dashboard/attendance/print?classId=${selectedClassId}&startDate=${reportFilters.startDate}&endDate=${reportFilters.endDate}&period=${reportFilters.period}`}>
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Class Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose a class to manage attendance</CardDescription>
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

        {selectedClassId && (
          <>
            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'sessions'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Sessions
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reports'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Reports
                    </div>
                  </button>
                </nav>
              </div>
            </div>
          </>
        )}

        {selectedClassId && activeTab === 'sessions' && (
          <>
            {/* Create Session */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create Attendance Session</CardTitle>
                <CardDescription>Create a new attendance session for today or a specific date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Lecture 1, Lab Session"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={sessionForm.description}
                      onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Introduction to Programming"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession || !sessionForm.date}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isCreatingSession ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Session
                </Button>
              </CardContent>
            </Card>

            {/* Sessions List */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Sessions</CardTitle>
                <CardDescription>
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No attendance sessions created yet. Create your first session to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Title</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Records</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
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
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {session.title || 'No title'}
                                </div>
                                {session.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {session.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Users className="w-4 h-4 mr-2" />
                                {session._count?.records || 0} students
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {session.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Closed
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/dashboard/attendance/sessions/${session.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/dashboard/attendance/sessions/${session.id}/mark`}>
                                    <CheckCircle className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/dashboard/attendance/sessions/${session.id}/analytics`}>
                                    <BarChart3 className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteSession(session.id)}
                                  disabled={deletingSessionId === session.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title={`Delete session: ${session.title || 'Untitled'} (${new Date(session.date).toLocaleDateString()})`}
                                >
                                  {deletingSessionId === session.id ? (
                                    <LoadingSpinner className="w-4 h-4" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
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

        {selectedClassId && activeTab === 'reports' && (
          <>
            {/* Report Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Report Filters</CardTitle>
                <CardDescription>Customize your attendance report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period
                    </label>
                    <select
                      value={reportFilters.period}
                      onChange={(e) => {
                        const period = e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom'
                        setReportFilters(prev => ({ ...prev, period }))
                        
                        // Set default dates based on period
                        const now = new Date()
                        let startDate = new Date()
                        
                        switch (period) {
                          case 'daily':
                            startDate = now
                            break
                          case 'weekly':
                            startDate.setDate(now.getDate() - 7)
                            break
                          case 'monthly':
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                            break
                          case 'custom':
                            // Keep current dates
                            return
                        }
                        
                        setReportFilters(prev => ({
                          ...prev,
                          period,
                          startDate: startDate.toISOString().split('T')[0],
                          endDate: now.toISOString().split('T')[0]
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Today</option>
                      <option value="weekly">Last 7 Days</option>
                      <option value="monthly">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportFilters.includeNotMarked}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, includeNotMarked: e.target.checked }))}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include Not Marked</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={loadAttendanceReports}
                    disabled={isLoadingReports}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isLoadingReports ? <LoadingSpinner size="sm" /> : <Filter className="w-4 h-4 mr-2" />}
                    Generate Report
                  </Button>
                  
                  <Button
                    onClick={exportToXLSX}
                    disabled={reports.length === 0 || isExporting}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {isExporting ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 mr-2" />}
                    Export XLSX
                  </Button>
                  

                  

                  

                  

                  

                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>
                  {reports.length} student{reports.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="flex justify-center items-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No attendance data found for the selected period. Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total Sessions</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Present</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Absent</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Late</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Excused</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Attendance Rate</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report.studentId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {report.studentName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {report.studentEmail}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {report.totalSessions}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {report.present}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                                <X className="w-4 h-4 mr-1" />
                                {report.absent}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                                <Clock className="w-4 h-4 mr-1" />
                                {report.late}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {report.excused}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  report.attendanceRate >= 90 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : report.attendanceRate >= 75
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {report.attendanceRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/dashboard/attendance/student/${report.studentId}?classId=${selectedClassId}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
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
