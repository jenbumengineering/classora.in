'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { 
  Printer, 
  ArrowLeft, 
  AlertTriangle,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  Activity,
  ChevronDown,
  ChevronUp
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
  ResponsiveContainer
} from 'recharts'

interface AttendanceReport {
  classId: string
  className: string
  classCode: string
  teacherName: string
  dateRange: {
    start: string
    end: string
  }
  period: string
  totalStudents: number
  totalSessions: number
  averageAttendance: number
  totalPresent: number
  totalAbsent: number
  totalLate: number
  totalExcused: number
  studentStats: Array<{
    studentId: string
    studentName: string
    studentEmail: string
    totalSessions: number
    present: number
    absent: number
    late: number
    excused: number
    notMarked: number
    attendanceRate: number
  }>
  dailyStats: Array<{
    date: string
    present: number
    absent: number
    late: number
    excused: number
    total: number
  }>
}

export default function AttendancePrintPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const classId = searchParams.get('classId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const period = searchParams.get('period') || 'custom'

  const [report, setReport] = useState<AttendanceReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Report configuration state
  const [selectedSections, setSelectedSections] = useState({
    classInfo: true,
    summaryStats: true,
    attendanceChart: true,
    studentTable: true,
    dailyTrends: true,
    glossary: true
  })

  const [selectedCharts, setSelectedCharts] = useState({
    attendanceChart: 'pie',
    dailyChart: 'line',
    studentChart: 'bar'
  })

  const [showConfig, setShowConfig] = useState(true)
  
  // Class and date configuration state
  const [classes, setClasses] = useState<Array<{ id: string, name: string, code: string }>>([])
  const [selectedClassId, setSelectedClassId] = useState(classId || '')
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [customStartDate, setCustomStartDate] = useState(startDate || '')
  const [customEndDate, setCustomEndDate] = useState(endDate || '')

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClassId && customStartDate && customEndDate) {
      fetchAttendanceReport()
    } else if (classId && startDate && endDate) {
      fetchAttendanceReport()
    } else {
      setError('Missing required parameters')
      setIsLoading(false)
    }
  }, [selectedClassId, customStartDate, customEndDate, selectedPeriod, classId, startDate, endDate, period])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchAttendanceReport = async () => {
    try {
      setIsLoading(true)
      const currentClassId = selectedClassId || classId
      const currentStartDate = customStartDate || startDate
      const currentEndDate = customEndDate || endDate
      const currentPeriod = selectedPeriod || period
      
      const response = await fetch(`/api/dashboard/attendance/report?classId=${currentClassId}&startDate=${currentStartDate}&endDate=${currentEndDate}&period=${currentPeriod}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance report')
      }

      const data = await response.json()
      setReport(data)
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

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod)
    
    const today = new Date()
    let start = new Date()
    let end = new Date()
    
    switch (newPeriod) {
      case 'day':
        // Today only
        break
      case 'week':
        // Current week (Monday to Sunday)
        const dayOfWeek = today.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        start.setDate(today.getDate() - daysToMonday)
        end.setDate(today.getDate() + (6 - dayOfWeek))
        break
      case 'month':
        // Current month
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'custom':
        // Keep current custom dates
        return
    }
    
    setCustomStartDate(start.toISOString().split('T')[0])
    setCustomEndDate(end.toISOString().split('T')[0])
  }

  const getAttendanceChartData = () => {
    if (!report) return []
    
    return [
      { name: 'Present', value: report.totalPresent, color: '#22c55e' },
      { name: 'Absent', value: report.totalAbsent, color: '#ef4444' },
      { name: 'Late', value: report.totalLate, color: '#f59e0b' },
      { name: 'Excused', value: report.totalExcused, color: '#6b7280' }
    ]
  }

  const getDailyChartData = () => {
    if (!report) return []
    
    return report.dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      present: stat.present,
      absent: stat.absent,
      late: stat.late,
      excused: stat.excused
    }))
  }

  const getStudentChartData = () => {
    if (!report) return []
    
    return report.studentStats.slice(0, 10).map(student => ({
      name: student.studentName,
      attendanceRate: student.attendanceRate
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load attendance report'}</p>
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
                  <h1 className="text-2xl font-bold text-gray-900">Attendance Report Configuration</h1>
                  <p className="text-gray-600">Customize what to include in the attendance report</p>
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

              {/* Class and Date Selection */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Report Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.code} - {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Period Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => handlePeriodChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="custom">Custom Range</option>
                      <option value="day">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Generate Report Button */}
                <div className="mt-4">
                  <Button 
                    onClick={fetchAttendanceReport}
                    disabled={!selectedClassId || !customStartDate || !customEndDate}
                    className="w-full md:w-auto"
                  >
                    Generate Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Group 1: Class Information */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">🏫 Class Information</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.classInfo}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, classInfo: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Class Details & Summary</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.summaryStats}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, summaryStats: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Summary Statistics</span>
                    </label>
                  </div>
                </div>

                {/* Group 2: Charts & Visualization */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">📊 Charts & Visualization</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.attendanceChart}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, attendanceChart: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Attendance Distribution Chart</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.dailyTrends}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, dailyTrends: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Daily Trends Chart</span>
                    </label>
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
                  </div>
                </div>

                {/* Group 3: Data Tables */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">📋 Data Tables</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedSections.studentTable}
                        onChange={(e) => setSelectedSections(prev => ({ ...prev, studentTable: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Student Attendance Table</span>
                    </label>
                  </div>
                </div>

                {/* Group 4: Additional Sections */}
                <div className="bg-blue-800 rounded-lg p-3">
                  <h4 className="text-white font-medium mb-3 text-sm">📚 Additional Sections</h4>
                  <div className="space-y-3">
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
                Attendance Report
              </h1>
              <p className="text-lg text-gray-600 print:text-base">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Class Information */}
            {selectedSections.classInfo && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">🏫 Class Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">Class Details</h3>
                    <div className="space-y-2 print:space-y-1">
                      <p className="text-sm print:text-xs"><span className="font-medium">Class Name:</span> {report.className}</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Class Code:</span> {report.classCode}</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Teacher:</span> {report.teacherName}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">Report Period</h3>
                    <div className="space-y-2 print:space-y-1">
                      <p className="text-sm print:text-xs"><span className="font-medium">Period:</span> {report.period}</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Date Range:</span> {new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}</p>
                      <p className="text-sm print:text-xs"><span className="font-medium">Total Students:</span> {report.totalStudents}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            {selectedSections.summaryStats && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">📊 Summary Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Average Attendance</h3>
                    <div className="text-2xl font-bold print:text-xl">{report.averageAttendance.toFixed(1)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Total Sessions</h3>
                    <div className="text-2xl font-bold print:text-xl">{report.totalSessions}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Present</h3>
                    <div className="text-2xl font-bold print:text-xl">{report.totalPresent}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg text-center print:p-3">
                    <h3 className="text-sm font-medium mb-2 print:text-xs">Absent</h3>
                    <div className="text-2xl font-bold print:text-xl">{report.totalAbsent}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Chart */}
            {selectedSections.attendanceChart && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">📈 Attendance Distribution</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                  <h3 className="font-semibold text-gray-900 mb-4 print:text-sm">Attendance Overview</h3>
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
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                            labelLine={false}
                          >
                            {getAttendanceChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                                                      <Tooltip formatter={(value, name) => [`${value} (${((value / getAttendanceChartData().reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`, name]} />
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
              </div>
            )}

            {/* Daily Trends */}
            {selectedSections.dailyTrends && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">📅 Daily Attendance Trends</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4 print:p-3">
                  <h3 className="font-semibold text-gray-900 mb-4 print:text-sm">Attendance Over Time</h3>
                  <div className="h-64 print:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getDailyChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [`${value}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                        <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                        <Line type="monotone" dataKey="excused" stroke="#6b7280" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Student Table */}
            {selectedSections.studentTable && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">👥 Student Attendance Details</h2>
                {report.studentStats.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:border-gray-300">
                    <div className="overflow-x-auto print:overflow-visible">
                      <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300">
                        <thead className="bg-gray-50 print:bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Student Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Total Sessions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Present
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Absent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Late
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Excused
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2 print:text-xs">
                              Attendance Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                          {report.studentStats.slice(0, 20).map((student) => (
                            <tr key={student.studentId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {student.studentName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:px-3 print:py-2 print:text-xs">
                                {student.studentEmail}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {student.totalSessions}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {student.present}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {student.absent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {student.late}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                                {student.excused}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap print:px-3 print:py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full print:text-xs whitespace-nowrap ${
                                  student.attendanceRate >= 90 ? 'bg-green-100 text-green-800 print:bg-green-200' :
                                  student.attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-800 print:bg-yellow-200' :
                                  'bg-red-100 text-red-800 print:bg-red-200'
                                }`}>
                                  {student.attendanceRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {report.studentStats.length > 20 && (
                        <div className="bg-gray-50 px-6 py-3 text-center print:bg-gray-100 print:px-3 print:py-2">
                          <p className="text-xs text-gray-500 print:text-xs">
                            Showing first 20 of {report.studentStats.length} students
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 print:p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center print:w-12 print:h-12">
                      <Users className="w-8 h-8 text-gray-400 print:w-6 print:h-6" />
                    </div>
                    <p className="text-gray-500 print:text-sm">No student attendance data found</p>
                  </div>
                )}
              </div>
            )}

            {/* Glossary */}
            {selectedSections.glossary && (
              <div className="mt-12 pt-8 border-t border-gray-200 print:mt-8 print:break-inside-avoid">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 print:text-lg">📚 Glossary & Explanations</h2>
                
                <div className="space-y-6 print:space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100 print:p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Attendance Metrics</h3>
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
                        <h4 className="font-medium text-gray-900 print:text-sm">Total Sessions</h4>
                        <p className="text-sm text-gray-600 print:text-xs">Number of attendance sessions conducted during the selected period.</p>
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
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Attendance Tracking:</strong> Attendance is recorded based on class sessions marked by professors.</p>
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Period Selection:</strong> Reports can be generated for daily, weekly, monthly, or custom date ranges.</p>
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Student Performance:</strong> Attendance rates help identify students who may need additional support.</p>
                      <p className="text-sm text-gray-700 print:text-xs">• <strong>Trend Analysis:</strong> Daily trends help identify patterns in attendance over time.</p>
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
