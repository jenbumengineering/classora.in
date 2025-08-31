'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { 
  Printer, 
  ArrowLeft, 
  AlertTriangle,
  User,
  Calendar,
  BookOpen,
  Target,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts'

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Class {
  id: string
  name: string
  code: string
}

interface QuizPerformance {
  quizId: string
  quizTitle: string
  className: string
  score: number
  maxScore: number
  attempts: number
  lastAttemptDate: string
}

interface AssignmentSubmission {
  assignmentId: string
  assignmentTitle: string
  className: string
  grade?: number
  maxGrade: number
  submittedAt: string
  status: 'submitted' | 'graded' | 'overdue'
}

interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  className: string
  reason?: string
}

interface SubjectAttendanceStats {
  className: string
  classCode: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendanceRate: number
}

interface SubjectQuizStats {
  className: string
  classCode: string
  totalQuizzes: number
  totalAttempts: number
  totalScore: number
  totalMaxScore: number
  averageScore: number
  averagePercentage: number
}

interface StudentAnalytics {
  student: Student
  classes: Class[]
  quizPerformance: QuizPerformance[]
  assignmentSubmissions: AssignmentSubmission[]
  attendanceRecords: AttendanceRecord[]
  subjectAttendanceStats: SubjectAttendanceStats[]
  subjectQuizStats: SubjectQuizStats[]
  overallStats: {
    totalClasses: number
    totalQuizzes: number
    totalAssignments: number
    totalAttendanceSessions: number
    averageQuizScore: number
    averageAssignmentGrade: number
    attendanceRate: number
    completionRate: number
  }
}

export default function StudentProfilePrintPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Report configuration state
  const [selectedSections, setSelectedSections] = useState({
    studentInfo: true,
    overallStats: true,
    attendanceStats: true,
    quizPerformance: true,
    assignmentSubmissions: true,
    classEnrollment: true,
    glossary: true
  })

  const [selectedCharts, setSelectedCharts] = useState({
    attendanceChart: 'pie',
    performanceChart: 'bar',
    timelineChart: 'line'
  })

  const [showConfig, setShowConfig] = useState(true)

  useEffect(() => {
    fetchStudentAnalytics()
  }, [studentId])

  const fetchStudentAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/dashboard/students/${studentId}/analytics`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch student analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    setShowConfig(false)
    setTimeout(() => {
      window.print()
      setShowConfig(true)
    }, 500)
  }

  const getAttendanceChartData = () => {
    if (!analytics) return []
    
    const statusCounts = analytics.attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = analytics.attendanceRecords.length
    
    // Calculate weighted attendance values for display
    const present = statusCounts['PRESENT'] || 0
    const absent = statusCounts['ABSENT'] || 0
    const late = statusCounts['LATE'] || 0
    const excused = statusCounts['EXCUSED'] || 0
    
    // Weighted attendance calculation (Option 3)
    // PRESENT: 100% weight, LATE: 50% weight, EXCUSED: 75% weight, ABSENT: 0% weight
    const weightedPresent = present * 1.0
    const weightedLate = late * 0.5
    const weightedExcused = excused * 0.75
    const weightedAbsent = absent * 0.0

    return [
      {
        name: 'PRESENT',
        value: weightedPresent,
        rawCount: present,
        color: '#10b981'
      },
      {
        name: 'LATE',
        value: weightedLate,
        rawCount: late,
        color: '#f59e0b'
      },
      {
        name: 'EXCUSED',
        value: weightedExcused,
        rawCount: excused,
        color: '#6b7280'
      },
      {
        name: 'ABSENT',
        value: weightedAbsent,
        rawCount: absent,
        color: '#ef4444'
      }
    ].filter(item => item.rawCount > 0) // Only show statuses that have records
  }

  const getPerformanceChartData = () => {
    if (!analytics || !analytics.subjectQuizStats) return []
    
    return analytics.subjectQuizStats.map(subject => ({
      name: subject.classCode,
      fullName: subject.className,
      averagePercentage: subject.averagePercentage,
      quizCount: subject.totalQuizzes
    }))
  }

  const getTimelineChartData = () => {
    if (!analytics) return []
    
    const monthlyData = analytics.attendanceRecords.reduce((acc, record) => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' })
      if (!acc[month]) {
        acc[month] = { present: 0, absent: 0, late: 0, excused: 0 }
      }
      acc[month][record.status]++
      return acc
    }, {} as Record<string, any>)

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      present: data.present,
      absent: data.absent,
      late: data.late,
      excused: data.excused
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load student analytics'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 print:bg-white">
        {/* Configuration Panel */}
        {showConfig && (
          <div className="bg-white border-b border-gray-200 p-6 print:hidden">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Student Profile Report Configuration</h1>
                  <p className="text-gray-600">Customize what to include in the student report</p>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Group 1: Student Information */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">👤 Student Information</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.studentInfo}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, studentInfo: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Student Profile & Details</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.overallStats}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, overallStats: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Overall Performance Summary</span>
                    </label>
                  </div>
                </div>

                {/* Group 2: Performance Metrics */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">📊 Performance Metrics</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.attendanceStats}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, attendanceStats: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Attendance Statistics</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.quizPerformance}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, quizPerformance: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Quiz Performance</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.assignmentSubmissions}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, assignmentSubmissions: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Assignment Submissions</span>
                    </label>
                  </div>
                </div>

                {/* Group 3: Charts & Visualization */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">📈 Charts & Visualization</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-white text-sm mb-2 block">Attendance Chart Type:</label>
                      <select
                        value={selectedCharts.attendanceChart}
                        onChange={(e) => setSelectedCharts(prev => ({ ...prev, attendanceChart: e.target.value }))}
                        className="w-full p-2 rounded text-sm"
                      >
                        <option value="pie">Pie Chart</option>
                        <option value="bar">Bar Chart</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white text-sm mb-2 block">Performance Chart Type:</label>
                      <select
                        value={selectedCharts.performanceChart}
                        onChange={(e) => setSelectedCharts(prev => ({ ...prev, performanceChart: e.target.value }))}
                        className="w-full p-2 rounded text-sm"
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Group 4: Additional Sections */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">📋 Additional Sections</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.classEnrollment}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, classEnrollment: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Class Enrollment Details</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.glossary}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, glossary: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Glossary & Explanations</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Content */}
        <div className="max-w-7xl mx-auto p-6 print:p-0">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 print:shadow-none print:p-0 mb-6">
            <div className="text-center border-b-4 border-blue-600 pb-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">
                Student Performance Report
              </h1>
              <p className="text-lg text-gray-600 print:text-base">
                Generated for {analytics.student.name} on {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Student Information */}
            {selectedSections.studentInfo && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">👤 Student Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">Student Profile</h3>
                    <div className="flex items-center space-x-3 mb-3">
                      {analytics.student.avatar ? (
                        <img 
                          src={analytics.student.avatar} 
                          alt={analytics.student.name}
                          className="w-12 h-12 rounded-full object-cover print:w-10 print:h-10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold print:w-10 print:h-10 print:text-sm">
                          {analytics.student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm print:text-xs">{analytics.student.name}</p>
                        <p className="text-xs text-gray-600 print:text-xs">{analytics.student.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1 print:space-y-1">
                      <p className="text-sm print:text-xs"><span className="font-medium">Student ID:</span> {analytics.student.id}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">Academic Summary</h3>
                    <div className="space-y-2 print:space-y-1">
                      <p className="text-sm print:text-xs"><span className="font-medium">Enrolled Classes:</span> {analytics.overallStats.totalClasses}</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Total Quizzes:</span> {analytics.overallStats.totalQuizzes}</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Total Assignments:</span> {analytics.overallStats.totalAssignments}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">Performance Overview</h3>
                    <div className="space-y-2 print:space-y-1">
                      <p className="text-sm print:text-xs"><span className="font-medium">Average Quiz Score:</span> {analytics.overallStats.averageQuizScore.toFixed(1)}%</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Average Assignment Grade:</span> {analytics.overallStats.averageAssignmentGrade.toFixed(1)}%</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Attendance Rate:</span> {analytics.overallStats.attendanceRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Performance Summary */}
            {selectedSections.overallStats && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">📊 Overall Performance Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Average Quiz Score</h3>
                    <div className="text-2xl font-bold print:text-xl">{analytics.overallStats.averageQuizScore.toFixed(1)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Average Assignment Grade</h3>
                    <div className="text-2xl font-bold print:text-xl">{analytics.overallStats.averageAssignmentGrade.toFixed(1)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Attendance Rate</h3>
                    <div className="text-2xl font-bold print:text-xl">{analytics.overallStats.attendanceRate.toFixed(1)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Completion Rate</h3>
                    <div className="text-2xl font-bold print:text-xl">{analytics.overallStats.completionRate.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Statistics */}
            {selectedSections.attendanceStats && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">📅 Attendance Statistics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-4 print:text-sm">Attendance Distribution</h3>
                    <div className="h-64 print:h-48">
                      {selectedCharts.attendanceChart === 'pie' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={getAttendanceChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, value, percent }) => {
                                const entry = getAttendanceChartData().find(item => item.name === name)
                                const total = getAttendanceChartData().reduce((sum, item) => sum + item.rawCount, 0)
                                const percentage = total > 0 ? ((entry?.rawCount || 0) / total * 100).toFixed(1) : '0.0'
                                return `${name}: ${entry?.rawCount || 0} (${percentage}%)`
                              }}
                              labelLine={false}
                            >
                              {getAttendanceChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => {
                              const entry = getAttendanceChartData().find(item => item.name === name)
                              const total = getAttendanceChartData().reduce((sum, item) => sum + item.rawCount, 0)
                              const percentage = total > 0 ? ((entry?.rawCount || 0) / total * 100).toFixed(1) : '0.0'
                              return [`${entry?.rawCount || 0} (${percentage}%)`, name]
                            }} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getAttendanceChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                            <Bar dataKey="value" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-4 print:text-sm">Attendance Details</h3>
                    {analytics.subjectAttendanceStats.length > 0 ? (
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
                          <thead className="bg-gray-50 print:bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-xs">
                                Subject
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-xs">
                                Rate
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                            {analytics.subjectAttendanceStats.map((subject, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:text-xs">
                                  <div>
                                    <div className="font-medium">{subject.className}</div>
                                    <div className="text-xs text-gray-500 print:text-xs">Code: {subject.classCode}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap print:px-3 print:py-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full print:text-xs ${
                                    subject.attendanceRate >= 90 ? 'bg-green-100 text-green-800 print:bg-green-200' :
                                    subject.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800 print:bg-yellow-200' :
                                    'bg-red-100 text-red-800 print:bg-red-200'
                                  }`}>
                                    {subject.attendanceRate.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 print:py-4">
                        <p className="text-gray-500 print:text-sm">No subject attendance data found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Performance */}
            {selectedSections.quizPerformance && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">🎯 Quiz Performance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-4 print:text-sm">Subject Performance</h3>
                    <div className="h-64 print:h-48">
                      {analytics.quizPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getPerformanceChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={60}
                              fontSize={11}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis fontSize={10} />
                            <Bar dataKey="averagePercentage" fill="#3b82f6">
                              <LabelList 
                                dataKey="averagePercentage" 
                                position="top" 
                                formatter={(value) => `${value.toFixed(1)}%`}
                                style={{ fontSize: 12, fontWeight: 'bold', fill: '#1f2937' }}
                              />
                            </Bar>
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'averagePercentage') {
                                  const data = getPerformanceChartData().find(item => item.averagePercentage === value)
                                  return [
                                    `${value.toFixed(1)}%`, 
                                    'Average Score'
                                  ]
                                }
                                return [value, name]
                              }}
                              labelFormatter={(label) => {
                                const data = getPerformanceChartData().find(item => item.name === label)
                                return data?.fullName || label
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center print:w-12 print:h-12">
                              <Target className="w-8 h-8 text-gray-400 print:w-6 print:h-6" />
                            </div>
                            <p className="text-gray-500 print:text-sm">No quiz attempts found</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-4 print:text-sm">Quiz Details</h3>
                    {analytics.subjectQuizStats && analytics.subjectQuizStats.length > 0 ? (
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
                          <thead className="bg-gray-50 print:bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-xs">
                                Subject
                              </th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-xs">
                                Avg Score
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                            {analytics.subjectQuizStats.map((subject, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:text-xs">
                                  <div>
                                    <div className="font-medium">{subject.className}</div>
                                    <div className="text-xs text-gray-500 print:text-xs">Code: {subject.classCode}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-900 print:text-xs">
                                  {subject.averagePercentage.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 print:py-4">
                        <p className="text-gray-500 print:text-sm">No quiz data found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Submissions */}
            {selectedSections.assignmentSubmissions && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">📝 Assignment Submissions</h2>
                {analytics.assignmentSubmissions.length > 0 ? (
                  <>
                    {/* Overall Average Grade */}
                    <div className="mb-4 print:mb-3">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg print:p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold print:text-base">Overall Average Grade</h3>
                            <p className="text-sm opacity-90 print:text-xs">Based on all graded assignments</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold print:text-2xl">
                              {(() => {
                                const gradedAssignments = analytics.assignmentSubmissions.filter(a => a.grade !== undefined)
                                if (gradedAssignments.length === 0) return 'N/A'
                                const totalGrade = gradedAssignments.reduce((sum, a) => sum + (a.grade || 0), 0)
                                const totalMaxGrade = gradedAssignments.reduce((sum, a) => sum + a.maxGrade, 0)
                                const averagePercentage = totalMaxGrade > 0 ? (totalGrade / totalMaxGrade) * 100 : 0
                                return `${averagePercentage.toFixed(1)}%`
                              })()}
                            </div>
                            <div className="text-sm opacity-90 print:text-xs">
                              {(() => {
                                const gradedAssignments = analytics.assignmentSubmissions.filter(a => a.grade !== undefined)
                                if (gradedAssignments.length === 0) return 'No graded assignments'
                                return `${gradedAssignments.length} graded assignment${gradedAssignments.length !== 1 ? 's' : ''}`
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:border-gray-300">
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
                        <thead className="bg-gray-50 print:bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Assignment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Class
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Submitted
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                          {analytics.assignmentSubmissions.map((assignment) => (
                            <tr key={assignment.assignmentId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {assignment.assignmentTitle}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:px-3 print:py-2 print:text-xs">
                                {assignment.className}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {assignment.grade !== undefined ? `${assignment.grade}/${assignment.maxGrade}` : 'Not graded'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap print:px-3 print:py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full print:text-xs ${
                                  assignment.status === 'graded' ? 'bg-green-100 text-green-800 print:bg-green-200' :
                                  assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800 print:bg-blue-200' :
                                  'bg-red-100 text-red-800 print:bg-red-200'
                                }`}>
                                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:px-3 print:py-2 print:text-xs">
                                {new Date(assignment.submittedAt).toLocaleDateString('en-GB')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 print:p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center print:w-12 print:h-12">
                      <FileText className="w-8 h-8 text-gray-400 print:w-6 print:h-6" />
                    </div>
                    <p className="text-gray-500 print:text-sm">No assignment submissions found</p>
                  </div>
                )}
              </div>
            )}

            {/* Class Enrollment */}
            {selectedSections.classEnrollment && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">🏫 Class Enrollment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-3">
                  {analytics.classes.map((classItem) => (
                    <div key={classItem.id} className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                      <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">{classItem.name}</h3>
                      <p className="text-sm text-gray-600 print:text-xs">Code: {classItem.code}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Glossary */}
            {selectedSections.glossary && (
              <div className="mt-12 pt-8 border-t border-gray-200 print:mt-8 print:break-inside-avoid">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 print:text-lg">📚 Glossary & Explanations</h2>
                
                <div className="space-y-6 print:space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Performance Metrics</h3>
                    <div className="space-y-3 print:space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Average Quiz Score</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Mean of all quiz scores across all classes. Formula: (Sum of all scores) ÷ (Total number of quizzes).</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Average Assignment Grade</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Mean of all assignment grades. Only graded assignments are included in this calculation.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Attendance Rate</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Percentage of present records out of total attendance records. Formula: (Present count) ÷ (Total records) × 100.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Completion Rate</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Percentage of assignments and quizzes completed. Formula: (Completed items) ÷ (Total assigned items) × 100.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Status Definitions</h3>
                    <div className="space-y-3 print:space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Present</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Student was present for the class session.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Absent</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Student was not present for the class session.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Late</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Student arrived after the session had started.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 print:text-sm">Excused</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Student was absent but had a valid excuse.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg print:bg-blue-100 print:p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">📝 Important Notes</h3>
                    <div className="space-y-2 print:space-y-1">
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Best Score Policy:</strong> For quizzes, only the best score per quiz is used in averages.</p>
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Graded Submissions:</strong> Only assignments with grades are included in grade calculations.</p>
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Attendance Tracking:</strong> Attendance is recorded based on class sessions marked by professors.</p>
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Performance Trends:</strong> Charts show trends over time to help identify patterns.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
