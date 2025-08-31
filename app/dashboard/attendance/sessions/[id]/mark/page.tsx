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
  Save
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

interface EnrolledStudent {
  studentId: string
  student: {
    id: string
    name: string
    email: string
  }
}

export default function AttendanceMarkPage() {
  const { user } = useAuth()
  const params = useParams()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string; notes: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (sessionId && user) {
      loadSession()
      loadEnrolledStudents()
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
        
        // Initialize attendance records from existing data
        const existingRecords: Record<string, { status: string; notes: string }> = {}
        data.session.records.forEach((record: AttendanceRecord) => {
          existingRecords[record.studentId] = {
            status: record.status,
            notes: record.notes || ''
          }
        })
        setAttendanceRecords(existingRecords)
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

  const loadEnrolledStudents = async () => {
    if (!sessionId || !user?.id) return

    try {
      // First get the session to get the classId
      const sessionResponse = await fetch(`/api/attendance?sessionId=${sessionId}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        const classId = sessionData.session.classId
        
        // Then get enrolled students for this class
        const studentsResponse = await fetch(`/api/classes/${classId}/enrollments`, {
          headers: {
            'x-user-id': user.id,
          },
        })
        
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setEnrolledStudents(studentsData.enrollments || [])
        } else {
          console.error('❌ Failed to load enrolled students')
        }
      }
    } catch (error) {
      console.error('Error loading enrolled students:', error)
    }
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }))
  }

  const handleSaveAttendance = async () => {
    if (!sessionId || !user?.id) return

    setIsSaving(true)
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        notes: data.notes
      }))

      console.log('💾 Saving attendance records:', records)
      
      const response = await fetch('/api/attendance/mark', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          sessionId,
          records
        }),
      })

      if (response.ok) {
        toast.success('Attendance saved successfully')
        // Reload session to get updated data
        await loadSession()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save attendance')
    } finally {
      setIsSaving(false)
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
      PRESENT: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Present' },
      ABSENT: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Absent' },
      LATE: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Late' },
      EXCUSED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Excused' }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {session.class.name} - {new Date(session.date).toLocaleDateString()}
            </p>
          </div>
          <Button 
            onClick={handleSaveAttendance} 
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Attendance
          </Button>
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
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</span>
                <p className="text-gray-900 dark:text-white">{enrolledStudents.length} enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Marking Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mark Student Attendance</CardTitle>
            <CardDescription>
              Mark attendance for each enrolled student using the radio buttons below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No students enrolled in this class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((enrollment, index) => {
                      const studentId = enrollment.student.id
                      const currentRecord = attendanceRecords[studentId] || { status: 'PRESENT', notes: '' }
                      
                      return (
                        <tr key={studentId} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {enrollment.student.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {enrollment.student.email}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`status-${studentId}`}
                                  value="PRESENT"
                                  checked={currentRecord.status === 'PRESENT'}
                                  onChange={(e) => handleStatusChange(studentId, e.target.value)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Present</span>
                              </label>
                              
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`status-${studentId}`}
                                  value="ABSENT"
                                  checked={currentRecord.status === 'ABSENT'}
                                  onChange={(e) => handleStatusChange(studentId, e.target.value)}
                                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Absent</span>
                              </label>
                              
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`status-${studentId}`}
                                  value="LATE"
                                  checked={currentRecord.status === 'LATE'}
                                  onChange={(e) => handleStatusChange(studentId, e.target.value)}
                                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Late</span>
                              </label>
                              
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`status-${studentId}`}
                                  value="EXCUSED"
                                  checked={currentRecord.status === 'EXCUSED'}
                                  onChange={(e) => handleStatusChange(studentId, e.target.value)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Excused</span>
                              </label>
                            </div>
                            
                            {/* Current Status Badge */}
                            <div className="mt-2">
                              {getStatusBadge(currentRecord.status)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="text"
                              value={currentRecord.notes}
                              onChange={(e) => handleNotesChange(studentId, e.target.value)}
                              placeholder="Add notes..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </td>
                        </tr>
                      )
                    })}
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
