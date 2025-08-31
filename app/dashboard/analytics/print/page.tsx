'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Code, 
  FileText, 
  Calendar as CalendarIcon,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Printer,
  ArrowLeft
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import Link from 'next/link'

interface ClassAnalytics {
  classId: string
  className: string
  classCode: string
  studentCount: number
  quizPerformance: {
    totalQuizzes: number
    totalAttempts: number
    averageScore: number
    completionRate: number
    topPerformers: Array<{
      studentName: string
      studentEmail: string
      averageScore: number
      attemptsCount: number
    }>
  }
  assignmentPerformance: {
    totalAssignments: number
    totalSubmissions: number
    averageGrade: number
    completionRate: number
    topPerformers: Array<{
      studentName: string
      studentEmail: string
      averageGrade: number
      submissionsCount: number
    }>
  }
  attendancePerformance: {
    totalSessions: number
    averageAttendance: number
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
    topAttendees: Array<{
      studentName: string
      studentEmail: string
      attendanceRate: number
      presentSessions: number
    }>
  }
  overallPerformance: {
    averageGrade: number
    completionRate: number
    engagementScore: number
  }
}

interface AnalyticsData {
  totalStudents: number
  totalClasses: number
  averageGrade: number
  completionRate: number
  activeStudents: number
  totalAssignments: number
  totalQuizzes: number
  totalNotes: number
  monthlyStats: {
    month: string
    students: number
    assignments: number
    quizzes: number
  }[]
  performanceMetrics: {
    studentEngagement: number
    assignmentCompletion: number
    quizPerformance: number
    contentConsumption: number
  }
  classAnalytics?: ClassAnalytics[]
}

export default function AnalyticsPrintPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCharts, setSelectedCharts] = useState({
    executiveSummary: true,
    performanceMetrics: true,
    monthlyTrends: true,
    classAnalytics: true,
    glossary: true
  })
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/analytics', {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    // Wait for content to render before printing
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleSelectAllClasses = () => {
    if (analytics?.classAnalytics) {
      setSelectedClassIds(analytics.classAnalytics.map(c => c.classId))
    }
  }

  const handleDeselectAllClasses = () => {
    setSelectedClassIds([])
  }

  const handleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const handleBack = () => {
    window.close()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading analytics report...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics data</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print Header - Hidden when printing */}
      <div className="bg-blue-600 text-white p-4 print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 hover:bg-blue-700 px-3 py-2 rounded"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Analytics</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">Analytics Report</span>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report</span>
              </button>
            </div>
          </div>
          
          {/* Configuration Panel */}
          <div className="bg-blue-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Report Configuration</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Group 1: Executive Summary and Performance Metrics */}
              <div className="bg-blue-800 rounded-lg p-3">
                <h4 className="text-white font-medium mb-3 text-sm">📊 Summary & Metrics</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedCharts.executiveSummary}
                      onChange={(e) => setSelectedCharts(prev => ({ ...prev, executiveSummary: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Executive Summary</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedCharts.performanceMetrics}
                      onChange={(e) => setSelectedCharts(prev => ({ ...prev, performanceMetrics: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Performance Metrics</span>
                  </label>
                </div>
              </div>

              {/* Group 2: Monthly Trends and Chart Type */}
              <div className="bg-blue-800 rounded-lg p-3">
                <h4 className="text-white font-medium mb-3 text-sm">📈 Trends & Visualization</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedCharts.monthlyTrends}
                      onChange={(e) => setSelectedCharts(prev => ({ ...prev, monthlyTrends: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Monthly Trends</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className="text-white text-sm">Chart Type:</span>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'area')}
                      className="px-3 py-1 rounded text-sm bg-white text-gray-900"
                    >
                      <option value="line">Line Chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="area">Area Chart</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 3: Class Analytics and Class Selection */}
              <div className="bg-blue-800 rounded-lg p-3 lg:col-span-2">
                <h4 className="text-white font-medium mb-3 text-sm">🏫 Class Analytics</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedCharts.classAnalytics}
                      onChange={(e) => setSelectedCharts(prev => ({ ...prev, classAnalytics: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Include Class Analytics</span>
                  </label>
                  
                  {analytics?.classAnalytics && analytics.classAnalytics.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm">Select Classes:</span>
                        <div className="space-x-2">
                          <button
                            onClick={handleSelectAllClasses}
                            className="text-xs bg-blue-500 hover:bg-blue-400 px-2 py-1 rounded transition-colors"
                          >
                            Select All
                          </button>
                          <button
                            onClick={handleDeselectAllClasses}
                            className="text-xs bg-blue-500 hover:bg-blue-400 px-2 py-1 rounded transition-colors"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {analytics.classAnalytics.map((classAnalytics) => (
                          <label key={classAnalytics.classId} className="flex items-center space-x-2 text-white">
                            <input
                              type="checkbox"
                              checked={selectedClassIds.includes(classAnalytics.classId)}
                              onChange={() => handleClassSelection(classAnalytics.classId)}
                              className="rounded"
                            />
                            <span className="text-xs truncate">{classAnalytics.classCode}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group 4: Glossary */}
              <div className="bg-blue-800 rounded-lg p-3 lg:col-span-2">
                <h4 className="text-white font-medium mb-3 text-sm">📚 Report Glossary</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedCharts.glossary}
                      onChange={(e) => setSelectedCharts(prev => ({ ...prev, glossary: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Include Glossary & Calculations</span>
                  </label>
                  <p className="text-xs text-blue-200">
                    Provides detailed explanations of all metrics and calculation methods used in this report.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto p-8 print:p-0 print:max-w-none print:mx-0">
        {/* Report Header */}
        <div className="text-center mb-8 print:mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-2xl">
            Student Performance Analytics Report
          </h1>
          <p className="text-lg text-gray-600 mb-4 print:text-sm">
            Generated for {user?.name} on {new Date().toLocaleDateString()}
          </p>
          <div className="w-32 h-1 bg-blue-600 mx-auto"></div>
        </div>

        {/* Executive Summary */}
        {selectedCharts.executiveSummary && (
          <div className="mb-8 print:mb-4 print:break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-lg">Executive Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              <div className="bg-blue-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                <div className="flex items-center mb-1 print:mb-0">
                  <Users className="w-4 h-4 text-blue-600 mr-2 print:w-3 print:h-3" />
                  <span className="font-semibold text-gray-900 print:text-sm">Total Students</span>
                </div>
                <div className="text-xl font-bold text-blue-600 print:text-lg">{analytics.totalStudents}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                <div className="flex items-center mb-1 print:mb-0">
                  <BookOpen className="w-4 h-4 text-green-600 mr-2 print:w-3 print:h-3" />
                  <span className="font-semibold text-gray-900 print:text-sm">Total Classes</span>
                </div>
                <div className="text-xl font-bold text-green-600 print:text-lg">{analytics.totalClasses}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                <div className="flex items-center mb-1 print:mb-0">
                  <TrendingUp className="w-4 h-4 text-purple-600 mr-2 print:w-3 print:h-3" />
                  <span className="font-semibold text-gray-900 print:text-sm">Average Grade</span>
                </div>
                <div className="text-xl font-bold text-purple-600 print:text-lg">{analytics.averageGrade.toFixed(1)}%</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                <div className="flex items-center mb-1 print:mb-0">
                  <BarChart3 className="w-4 h-4 text-orange-600 mr-2 print:w-3 print:h-3" />
                  <span className="font-semibold text-gray-900 print:text-sm">Completion Rate</span>
                </div>
                <div className="text-xl font-bold text-orange-600 print:text-lg">{analytics.completionRate}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {selectedCharts.performanceMetrics && (
          <div className="mb-8 print:mb-4 print:break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-lg">Performance Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              <div className="border border-gray-200 p-3 rounded-lg print:p-2">
                <div className="text-sm text-gray-600 mb-1 print:text-xs">Student Engagement</div>
                <div className="text-lg font-bold text-gray-900 print:text-base">{analytics.performanceMetrics.studentEngagement}%</div>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg print:p-2">
                <div className="text-sm text-gray-600 mb-1 print:text-xs">Assignment Completion</div>
                <div className="text-lg font-bold text-gray-900 print:text-base">{analytics.performanceMetrics.assignmentCompletion}%</div>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg print:p-2">
                <div className="text-sm text-gray-600 mb-1 print:text-xs">Quiz Performance</div>
                <div className="text-lg font-bold text-gray-900 print:text-base">{analytics.performanceMetrics.quizPerformance}%</div>
              </div>
              <div className="border border-gray-200 p-3 rounded-lg print:p-2">
                <div className="text-sm text-gray-600 mb-1 print:text-xs">Content Consumption</div>
                <div className="text-lg font-bold text-gray-900 print:text-base">{analytics.performanceMetrics.contentConsumption}</div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Trends Chart */}
        {selectedCharts.monthlyTrends && (
          <div className="mb-8 print:mb-4 print:break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-lg">Monthly Trends</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 print:border-gray-300 print:p-2">
              <ResponsiveContainer width="100%" height={250} className="print:h-48">
                {chartType === 'line' && (
                  <LineChart data={analytics.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2} name="Students" />
                    <Line type="monotone" dataKey="assignments" stroke="#10B981" strokeWidth={2} name="Assignments" />
                    <Line type="monotone" dataKey="quizzes" stroke="#8B5CF6" strokeWidth={2} name="Quizzes" />
                  </LineChart>
                )}
                {chartType === 'bar' && (
                  <BarChart data={analytics.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#3B82F6" name="Students" />
                    <Bar dataKey="assignments" fill="#10B981" name="Assignments" />
                    <Bar dataKey="quizzes" fill="#8B5CF6" name="Quizzes" />
                  </BarChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={analytics.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="students" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Students" />
                    <Area type="monotone" dataKey="assignments" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Assignments" />
                    <Area type="monotone" dataKey="quizzes" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Quizzes" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Class Performance Analytics */}
        {selectedCharts.classAnalytics && analytics.classAnalytics && analytics.classAnalytics.length > 0 && (
          <div className="mb-8 print:mb-4 print:break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-lg">Class Performance Analytics</h2>
            <div className="space-y-4 print:space-y-3">
              {analytics.classAnalytics
                .filter(classAnalytics => selectedClassIds.length === 0 || selectedClassIds.includes(classAnalytics.classId))
                .map((classAnalytics) => (
                <div key={classAnalytics.classId} className="border border-gray-200 rounded-lg p-4 print:border-gray-300 print:break-inside-avoid print:p-3">
                  <div className="mb-3 print:mb-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 print:text-base">
                      {classAnalytics.classCode} - {classAnalytics.className}
                    </h3>
                    <p className="text-gray-600 print:text-sm">Total Students: {classAnalytics.studentCount}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                    {/* Quiz Performance */}
                    <div className="bg-blue-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                      <h4 className="font-semibold text-gray-900 mb-2 print:mb-1 flex items-center print:text-sm">
                        <Code className="w-3 h-3 mr-1 text-blue-600 print:w-2 print:h-2" />
                        Quiz Performance
                      </h4>
                      <div className="space-y-1 text-xs print:text-xs">
                        <div className="flex justify-between">
                          <span>Average Score:</span>
                          <span className="font-semibold">{classAnalytics.quizPerformance.averageScore.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completion Rate:</span>
                          <span className="font-semibold">{classAnalytics.quizPerformance.completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Attempts:</span>
                          <span className="font-semibold">{classAnalytics.quizPerformance.totalAttempts}</span>
                        </div>
                      </div>
                      
                      {classAnalytics.quizPerformance.topPerformers.length > 0 && (
                        <div className="mt-2 print:mt-1">
                          <h5 className="font-medium text-gray-900 mb-1 print:text-xs">Top Performers:</h5>
                          <div className="space-y-0.5">
                            {classAnalytics.quizPerformance.topPerformers.slice(0, 3).map((performer, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span className="truncate">{index + 1}. {performer.studentName}</span>
                                <span className="font-semibold">{performer.averageScore.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignment Performance */}
                    <div className="bg-green-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                      <h4 className="font-semibold text-gray-900 mb-2 print:mb-1 flex items-center print:text-sm">
                        <FileText className="w-3 h-3 mr-1 text-green-600 print:w-2 print:h-2" />
                        Assignment Performance
                      </h4>
                      <div className="space-y-1 text-xs print:text-xs">
                        <div className="flex justify-between">
                          <span>Average Grade:</span>
                          <span className="font-semibold">{classAnalytics.assignmentPerformance.averageGrade.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completion Rate:</span>
                          <span className="font-semibold">{classAnalytics.assignmentPerformance.completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Submissions:</span>
                          <span className="font-semibold">{classAnalytics.assignmentPerformance.totalSubmissions}</span>
                        </div>
                      </div>
                      
                      {classAnalytics.assignmentPerformance.topPerformers.length > 0 && (
                        <div className="mt-2 print:mt-1">
                          <h5 className="font-medium text-gray-900 mb-1 print:text-xs">Top Performers:</h5>
                          <div className="space-y-0.5">
                            {classAnalytics.assignmentPerformance.topPerformers.slice(0, 3).map((performer, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span className="truncate">{index + 1}. {performer.studentName}</span>
                                <span className="font-semibold">{performer.averageGrade.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attendance Performance */}
                    <div className="bg-purple-50 p-3 rounded-lg print:bg-gray-100 print:p-2">
                      <h4 className="font-semibold text-gray-900 mb-2 print:mb-1 flex items-center print:text-sm">
                        <CalendarIcon className="w-3 h-3 mr-1 text-purple-600 print:w-2 print:h-2" />
                        Attendance Performance
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Average Attendance:</span>
                          <span className="font-semibold">{classAnalytics.attendancePerformance.averageAttendance.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Present Sessions:</span>
                          <span className="font-semibold">{classAnalytics.attendancePerformance.presentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Sessions:</span>
                          <span className="font-semibold">{classAnalytics.attendancePerformance.totalSessions}</span>
                        </div>
                      </div>
                      
                      {classAnalytics.attendancePerformance.topAttendees.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Top Attendees:</h5>
                          <div className="space-y-1">
                            {classAnalytics.attendancePerformance.topAttendees.slice(0, 3).map((attendee, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span className="truncate">{index + 1}. {attendee.studentName}</span>
                                <span className="font-semibold">{attendee.attendanceRate.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overall Performance Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Overall Performance Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{classAnalytics.overallPerformance.averageGrade.toFixed(1)}%</div>
                        <div className="text-gray-600">Average Grade</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{classAnalytics.overallPerformance.completionRate.toFixed(1)}%</div>
                        <div className="text-gray-600">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{classAnalytics.overallPerformance.engagementScore.toFixed(1)}%</div>
                        <div className="text-gray-600">Engagement Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Glossary Section */}
        {selectedCharts.glossary && (
          <div className="mt-12 pt-8 border-t border-gray-200 print:mt-8 print:break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 print:text-lg">📚 Glossary & Calculations</h2>
            
            <div className="space-y-6 print:space-y-4">
              {/* Executive Summary Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Executive Summary Metrics</h3>
                <div className="space-y-3 print:space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Total Students</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Unique students enrolled across all classes, calculated by counting distinct student IDs from all class enrollments.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Total Classes</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Number of classes created by the professor.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Average Grade</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Mean of all quiz scores and assignment grades across all classes. Formula: (Sum of all grades) ÷ (Total number of grades).</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Completion Rate</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of students who have submitted at least one assignment. Formula: (Students with submissions) ÷ (Total students) × 100.</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Performance Metrics</h3>
                <div className="space-y-3 print:space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Student Engagement</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of students active in the last 30 days (quiz attempts or assignment submissions). Formula: (Active students) ÷ (Total students) × 100.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Assignment Completion</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Same as overall completion rate - percentage of students who have submitted assignments.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Quiz Performance</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of quiz attempts with scores ≥ 70%. Formula: (Successful attempts) ÷ (Total attempts) × 100.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Content Consumption</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Average content items per student. Formula: (Total notes + quizzes + assignments) ÷ (Total students).</p>
                  </div>
                </div>
              </div>

              {/* Class Performance Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Class Performance Metrics</h3>
                <div className="space-y-3 print:space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Average Grade (Class)</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Mean of all quiz scores and assignment grades for the specific class. Formula: (Sum of class grades) ÷ (Total class grades).</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Completion Rate (Class)</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of enrolled students who have participated in quizzes OR assignments. Formula: MAX(Quiz participants, Assignment participants) ÷ (Class enrollment) × 100.</p>
                    <p className="text-xs text-gray-500 mt-1 print:text-xs">Note: Uses MAX to avoid double-counting students who participate in both.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Engagement Score (Class)</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Comprehensive participation rate across all activities. Formula: (Quiz participants + Assignment participants + Attendance participants) ÷ (Class enrollment × 3) × 100.</p>
                    <p className="text-xs text-gray-500 mt-1 print:text-xs">Note: Each activity type (quiz, assignment, attendance) is weighted equally (1/3 each).</p>
                  </div>
                </div>
              </div>

              {/* Quiz Performance */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Quiz Performance Metrics</h3>
                <div className="space-y-3 print:space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Average Score</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Mean of all quiz scores for the class. Formula: (Sum of all scores) ÷ (Total attempts).</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Completion Rate</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of enrolled students who have attempted at least one quiz. Formula: (Students with quiz attempts) ÷ (Class enrollment) × 100.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Top Performers</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Students ranked by their average quiz score across all quizzes in the class.</p>
                  </div>
                </div>
              </div>

              {/* Assignment Performance */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Assignment Performance Metrics</h3>
                <div className="space-y-3 print:space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Average Grade</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Mean of all assignment grades for the class. Formula: (Sum of all grades) ÷ (Total submissions with grades).</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Completion Rate</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of enrolled students who have submitted at least one assignment. Formula: (Students with submissions) ÷ (Class enrollment) × 100.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Top Performers</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Students ranked by their average assignment grade across all assignments in the class.</p>
                  </div>
                </div>
              </div>

              {/* Attendance Performance */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Attendance Performance Metrics</h3>
                <div className="space-y-3 print:space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Average Attendance</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Percentage of present records out of total attendance records. Formula: (Present count) ÷ (Total records) × 100.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Attendance Rate (Student)</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Individual student's attendance percentage. Formula: (Student's present sessions) ÷ (Student's total sessions) × 100.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 print:text-sm">Top Attendees</h4>
                    <p className="text-sm text-gray-600 print:text-xs">Students ranked by their individual attendance rate across all sessions.</p>
                  </div>
                </div>
              </div>

              {/* Calculation Notes */}
              <div className="bg-blue-50 p-4 rounded-lg print:bg-blue-100 print:p-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">📝 Important Calculation Notes</h3>
                <div className="space-y-2 print:space-y-1">
                  <p className="text-sm text-gray-700 print:text-xs">• <strong>Best Score Policy:</strong> For quizzes, only the best score per student per quiz is used in averages to avoid bias from multiple attempts.</p>
                  <p className="text-sm text-gray-700 print:text-xs">• <strong>Graded Submissions:</strong> Only assignments with grades are included in grade calculations.</p>
                  <p className="text-sm text-gray-700 print:text-xs">• <strong>Active Period:</strong> Student engagement is calculated based on activity in the last 30 days.</p>
                  <p className="text-sm text-gray-700 print:text-xs">• <strong>Participation Metrics:</strong> Completion rates focus on participation rather than perfect scores.</p>
                  <p className="text-sm text-gray-700 print:text-xs">• <strong>Equal Weighting:</strong> All activity types (quiz, assignment, attendance) are weighted equally in engagement scores.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center print:mt-8">
          <p className="text-gray-600 text-sm">
            Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Classora Analytics Platform - Comprehensive Student Performance Report
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4 portrait;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .print\\:h-48 {
            height: 12rem !important;
          }
          
          /* Hide elements that shouldn't print */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Ensure charts render properly */
          svg {
            max-width: 100% !important;
            height: auto !important;
          }
          
          /* Optimize text sizes for print */
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }
          
          .print\\:text-base {
            font-size: 1rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          
          /* Optimize spacing for print */
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }
          
          .print\\:mb-1 {
            margin-bottom: 0.25rem !important;
          }
          
          .print\\:mb-0 {
            margin-bottom: 0 !important;
          }
          
          .print\\:mt-1 {
            margin-top: 0.25rem !important;
          }
          
          .print\\:mt-2 {
            margin-top: 0.5rem !important;
          }
          
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          
          .print\\:p-3 {
            padding: 0.75rem !important;
          }
          
          .print\\:gap-2 {
            gap: 0.5rem !important;
          }
          
          .print\\:space-y-3 > * + * {
            margin-top: 0.75rem !important;
          }
          
          .print\\:space-y-0\\.5 > * + * {
            margin-top: 0.125rem !important;
          }
          
          /* Ensure proper page breaks */
          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Force page breaks where needed */
          .print\\:page-break-before {
            page-break-before: always;
          }
          
          /* Optimize grid layouts for print */
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          
          .print\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  )
}
