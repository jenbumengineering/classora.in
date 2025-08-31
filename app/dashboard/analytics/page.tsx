'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Code, 
  FileText, 
  Calendar as CalendarIcon,
  Download,
  Mail,
  PieChart,
  Activity,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

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
  attendanceStats?: {
    present: number
    absent: number
    late: number
    excused: number
  }
  classPerformance?: {
    className: string
    averageGrade: number
    completionRate: number
    studentCount: number
  }[]
  classAnalytics?: ClassAnalytics[]
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0,
    totalClasses: 0,
    averageGrade: 0,
    completionRate: 0,
    activeStudents: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    totalNotes: 0,
    monthlyStats: [],
    performanceMetrics: {
      studentEngagement: 0,
      assignmentCompletion: 0,
      quizPerformance: 0,
      contentConsumption: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar')
  const [isExporting, setIsExporting] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [isExportingXLSX, setIsExportingXLSX] = useState(false)

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

  const handlePrintReport = () => {
    // Open print report page in new window
    const printWindow = window.open('/dashboard/analytics/print', '_blank')
    if (printWindow) {
      printWindow.focus()
    } else {
      toast.error('Please allow pop-ups to print the report')
    }
  }

  const handleEmailReport = async () => {
    setIsEmailing(true)
    try {
      const response = await fetch('/api/dashboard/analytics/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          email: user?.email,
          professorName: user?.name,
          includeCharts: true,
          dateRange: 'last30days'
        }),
      })

      if (response.ok) {
        toast.success('Analytics report sent to your email!')
      } else {
        throw new Error('Failed to send report')
      }
    } catch (error) {
      console.error('Error sending report:', error)
      toast.error('Failed to send analytics report')
    } finally {
      setIsEmailing(false)
    }
  }

  const exportToXLSX = () => {
    if (!analytics.classAnalytics || analytics.classAnalytics.length === 0) {
      toast.error('No analytics data to export')
      return
    }

    console.log('📊 Starting XLSX export with', analytics.classAnalytics.length, 'classes')
    setIsExportingXLSX(true)
    
    try {
      // Create workbook
      const wb = XLSX.utils.book_new()

      // 1. Summary Sheet
      const summaryData = [
        ['Analytics Summary Report'],
        ['Generated:', new Date().toLocaleDateString()],
        ['Professor:', user?.name || 'Unknown'],
        [''],
        ['Overall Statistics'],
        ['Total Students:', analytics.totalStudents],
        ['Total Classes:', analytics.totalClasses],
        ['Average Grade:', analytics.averageGrade.toFixed(2) + '%'],
        ['Completion Rate:', analytics.completionRate + '%'],
        ['Active Students:', analytics.activeStudents],
        ['Total Assignments:', analytics.totalAssignments],
        ['Total Quizzes:', analytics.totalQuizzes],
        ['Total Notes:', analytics.totalNotes],
        [''],
        ['Performance Metrics'],
        ['Student Engagement:', analytics.performanceMetrics.studentEngagement + '%'],
        ['Assignment Completion:', analytics.performanceMetrics.assignmentCompletion + '%'],
        ['Quiz Performance:', analytics.performanceMetrics.quizPerformance + '%'],
        ['Content Consumption:', analytics.performanceMetrics.contentConsumption]
      ]

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // 2. Class Performance Overview
      const classOverviewData = [
        ['Class Code', 'Class Name', 'Students', 'Avg Grade', 'Completion Rate', 'Engagement Score', 'Quiz Performance', 'Assignment Performance', 'Attendance Rate']
      ]

      analytics.classAnalytics.forEach(classAnalytics => {
        classOverviewData.push([
          classAnalytics.classCode,
          classAnalytics.className,
          classAnalytics.studentCount,
          classAnalytics.overallPerformance.averageGrade.toFixed(2) + '%',
          classAnalytics.overallPerformance.completionRate.toFixed(2) + '%',
          classAnalytics.overallPerformance.engagementScore.toFixed(2) + '%',
          classAnalytics.quizPerformance.averageScore.toFixed(2) + '%',
          classAnalytics.assignmentPerformance.averageGrade.toFixed(2) + '%',
          classAnalytics.attendancePerformance.averageAttendance.toFixed(2) + '%'
        ])
      })

      const classOverviewWs = XLSX.utils.aoa_to_sheet(classOverviewData)
      classOverviewWs['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, 
        { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 }
      ]
      XLSX.utils.book_append_sheet(wb, classOverviewWs, 'Class Overview')

      // 3. Detailed Class Analytics (one sheet per class)
      analytics.classAnalytics.forEach(classAnalytics => {
        const sheetName = classAnalytics.classCode.substring(0, 31) // Excel sheet name limit
        
        const classData = [
          [`${classAnalytics.classCode} - ${classAnalytics.className} Analytics`],
          ['Generated:', new Date().toLocaleDateString()],
          [''],
          ['Class Statistics'],
          ['Total Students:', classAnalytics.studentCount],
          ['Total Quizzes:', classAnalytics.quizPerformance.totalQuizzes],
          ['Total Assignments:', classAnalytics.assignmentPerformance.totalAssignments],
          ['Total Sessions:', classAnalytics.attendancePerformance.totalSessions],
          [''],
          ['Quiz Performance'],
          ['Total Attempts:', classAnalytics.quizPerformance.totalAttempts],
          ['Average Score:', classAnalytics.quizPerformance.averageScore.toFixed(2) + '%'],
          ['Completion Rate:', classAnalytics.quizPerformance.completionRate.toFixed(2) + '%'],
          [''],
          ['Top Quiz Performers'],
          ['Student Name', 'Student Email', 'Average Score', 'Attempts Count']
        ]

        classAnalytics.quizPerformance.topPerformers.forEach(performer => {
          classData.push([
            performer.studentName,
            performer.studentEmail,
            performer.averageScore.toFixed(2) + '%',
            performer.attemptsCount
          ])
        })

        classData.push([''])
        classData.push(['Assignment Performance'])
        classData.push(['Total Submissions:', classAnalytics.assignmentPerformance.totalSubmissions])
        classData.push(['Average Grade:', classAnalytics.assignmentPerformance.averageGrade.toFixed(2) + '%'])
        classData.push(['Completion Rate:', classAnalytics.assignmentPerformance.completionRate.toFixed(2) + '%'])
        classData.push([''])
        classData.push(['Top Assignment Performers'])
        classData.push(['Student Name', 'Student Email', 'Average Grade', 'Submissions Count'])

        classAnalytics.assignmentPerformance.topPerformers.forEach(performer => {
          classData.push([
            performer.studentName,
            performer.studentEmail,
            performer.averageGrade.toFixed(2) + '%',
            performer.submissionsCount
          ])
        })

        classData.push([''])
        classData.push(['Attendance Performance'])
        classData.push(['Present Sessions:', classAnalytics.attendancePerformance.presentCount])
        classData.push(['Absent Sessions:', classAnalytics.attendancePerformance.absentCount])
        classData.push(['Late Sessions:', classAnalytics.attendancePerformance.lateCount])
        classData.push(['Excused Sessions:', classAnalytics.attendancePerformance.excusedCount])
        classData.push(['Average Attendance:', classAnalytics.attendancePerformance.averageAttendance.toFixed(2) + '%'])
        classData.push([''])
        classData.push(['Top Attendees'])
        classData.push(['Student Name', 'Student Email', 'Attendance Rate', 'Present Sessions'])

        classAnalytics.attendancePerformance.topAttendees.forEach(attendee => {
          classData.push([
            attendee.studentName,
            attendee.studentEmail,
            attendee.attendanceRate.toFixed(2) + '%',
            attendee.presentSessions
          ])
        })

        const classWs = XLSX.utils.aoa_to_sheet(classData)
        classWs['!cols'] = [
          { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }
        ]
        XLSX.utils.book_append_sheet(wb, classWs, sheetName)
      })

      // 4. Monthly Trends
      const monthlyData = [
        ['Month', 'Students', 'Assignments', 'Quizzes']
      ]

      analytics.monthlyStats.forEach(stat => {
        monthlyData.push([
          stat.month,
          stat.students,
          stat.assignments,
          stat.quizzes
        ])
      })

      const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData)
      monthlyWs['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Trends')

      // Generate filename
      const filename = `Student_Performance_Analytics_${user?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Professor'}_${new Date().toISOString().split('T')[0]}.xlsx`

      // Save file
      console.log('📊 Saving XLSX file:', filename)
      XLSX.writeFile(wb, filename)
      toast.success('XLSX file exported successfully!')
    } catch (error) {
      console.error('Error exporting to XLSX:', error)
      toast.error('Failed to export XLSX file')
    } finally {
      setIsExportingXLSX(false)
    }
  }

  const renderChart = () => {
    const data = analytics.monthlyStats.map(stat => ({
      name: stat.month,
      students: stat.students,
      assignments: stat.assignments,
      quizzes: stat.quizzes
    }))

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

    switch (selectedChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" fill="#8884d8" />
              <Bar dataKey="assignments" fill="#82ca9d" />
              <Bar dataKey="quizzes" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="students" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="assignments" stroke="#82ca9d" strokeWidth={2} />
              <Line type="monotone" dataKey="quizzes" stroke="#ffc658" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="students" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="assignments" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              <Area type="monotone" dataKey="quizzes" stackId="1" stroke="#ffc658" fill="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
        )
      
      case 'pie':
        const pieData = [
          { name: 'Students', value: analytics.totalStudents },
          { name: 'Assignments', value: analytics.totalAssignments },
          { name: 'Quizzes', value: analytics.totalQuizzes },
          { name: 'Notes', value: analytics.totalNotes }
        ]
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      
      default:
        return null
    }
  }

  const renderAttendanceChart = () => {
    if (!analytics.attendanceStats) return null

    const data = [
      { name: 'Present', value: analytics.attendanceStats.present, color: '#10b981' },
      { name: 'Absent', value: analytics.attendanceStats.absent, color: '#ef4444' },
      { name: 'Late', value: analytics.attendanceStats.late, color: '#f59e0b' },
      { name: 'Excused', value: analytics.attendanceStats.excused, color: '#3b82f6' }
    ]

    return (
      <ResponsiveContainer width="100%" height={250}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    )
  }

  const renderClassPerformanceChart = () => {
    if (!analytics.classPerformance) return null

    const data = analytics.classPerformance.map(cls => ({
      name: cls.className,
      averageGrade: cls.averageGrade,
      completionRate: cls.completionRate,
      studentCount: cls.studentCount
    }))

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="averageGrade" fill="#8884d8" name="Average Grade (%)" />
          <Bar dataKey="completionRate" fill="#82ca9d" name="Completion Rate (%)" />
        </BarChart>
      </ResponsiveContainer>
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
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Track your teaching performance and student engagement' 
                : 'Monitor your learning progress and achievements'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={exportToXLSX}
              disabled={isExportingXLSX || !analytics.classAnalytics || analytics.classAnalytics.length === 0}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {isExportingXLSX ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 mr-2" />}
              Export XLSX
            </Button>
            <Button
              onClick={handlePrintReport}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button
              onClick={handleEmailReport}
              disabled={isEmailing}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              {isEmailing ? <LoadingSpinner size="sm" /> : <Mail className="w-4 h-4 mr-2" />}
              Email Report
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.role === 'PROFESSOR' ? 'Total Students' : 'Enrolled Classes'}
                </CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.role === 'PROFESSOR' ? analytics.totalStudents : analytics.totalClasses}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'Active students' : 'Your classes'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.role === 'PROFESSOR' ? 'Average Grade' : 'Your Average'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.averageGrade}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'Class average' : 'Overall performance'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.role === 'PROFESSOR' ? 'Completion Rate' : 'Progress'}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.completionRate}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'Assignment completion' : 'Course completion'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.role === 'PROFESSOR' ? 'Active Students' : 'Active Days'}
                </CardTitle>
                <CalendarIcon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.role === 'PROFESSOR' ? analytics.activeStudents : analytics.performanceMetrics.studentEngagement}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'This week' : 'This month'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Chart */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Monthly Trends</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Track performance over time with different chart types
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={selectedChartType === 'bar' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChartType('bar')}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedChartType === 'line' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChartType('line')}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedChartType === 'area' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChartType('area')}
                  >
                    <Activity className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedChartType === 'pie' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChartType('pie')}
                  >
                    <PieChart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>

          {/* Content Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Assignments</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'Created assignments' : 'Completed assignments'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {analytics.totalAssignments}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 mr-2" />
                  {user?.role === 'PROFESSOR' ? 'Total created' : 'Total completed'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quizzes</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'Created quizzes' : 'Taken quizzes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {analytics.totalQuizzes}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Code className="w-4 h-4 mr-2" />
                  {user?.role === 'PROFESSOR' ? 'Total created' : 'Total taken'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Notes</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'PROFESSOR' ? 'Published notes' : 'Available notes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {analytics.totalNotes}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {user?.role === 'PROFESSOR' ? 'Total published' : 'Total available'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Analytics Section */}
          {user?.role === 'PROFESSOR' && analytics.classAnalytics && analytics.classAnalytics.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Class Performance Analytics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Detailed performance metrics categorized by classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Class Selection */}
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Class:
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Classes</option>
                      {analytics.classAnalytics.map((classAnalytics) => (
                        <option key={classAnalytics.classId} value={classAnalytics.classId}>
                          {classAnalytics.classCode} - {classAnalytics.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Performance Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {analytics.classAnalytics
                      .filter(classAnalytics => selectedClassId === 'all' || classAnalytics.classId === selectedClassId)
                      .map((classAnalytics) => (
                        <Card key={classAnalytics.classId} className="border-gray-200 dark:border-gray-600">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-gray-900 dark:text-white">
                              {classAnalytics.classCode}
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                              {classAnalytics.className}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Overall Performance */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Overall Performance</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Avg Grade:</span>
                                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.overallPerformance.averageGrade.toFixed(1)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.overallPerformance.completionRate.toFixed(1)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Engagement:</span>
                                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.overallPerformance.engagementScore.toFixed(1)}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Students:</span>
                                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.studentCount}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quiz Performance */}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <Code className="w-4 h-4 mr-2 text-blue-500" />
                                Quiz Performance
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.quizPerformance.averageScore.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.quizPerformance.completionRate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Total Attempts:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.quizPerformance.totalAttempts}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Assignment Performance */}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-green-500" />
                                Assignment Performance
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Average Grade:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.assignmentPerformance.averageGrade.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.assignmentPerformance.completionRate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Total Submissions:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.assignmentPerformance.totalSubmissions}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Attendance Performance */}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2 text-purple-500" />
                                Attendance Performance
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Average Attendance:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.attendancePerformance.averageAttendance.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Present Sessions:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.attendancePerformance.presentCount}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {classAnalytics.attendancePerformance.totalSessions}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Top Performers */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <Target className="w-4 h-4 mr-2 text-orange-500" />
                                Top Performers
                              </h4>
                              
                              {/* Top Quiz Performers */}
                              {classAnalytics.quizPerformance.topPerformers.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quiz Champions</h5>
                                  <div className="space-y-1">
                                    {classAnalytics.quizPerformance.topPerformers.slice(0, 3).map((performer, index) => (
                                      <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-700 dark:text-gray-300 truncate">
                                          {index + 1}. {performer.studentName}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {performer.averageScore.toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Top Assignment Performers */}
                              {classAnalytics.assignmentPerformance.topPerformers.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assignment Stars</h5>
                                  <div className="space-y-1">
                                    {classAnalytics.assignmentPerformance.topPerformers.slice(0, 3).map((performer, index) => (
                                      <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-700 dark:text-gray-300 truncate">
                                          {index + 1}. {performer.studentName}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {performer.averageGrade.toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Top Attendees */}
                              {classAnalytics.attendancePerformance.topAttendees.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Attendance Leaders</h5>
                                  <div className="space-y-1">
                                    {classAnalytics.attendancePerformance.topAttendees.slice(0, 3).map((attendee, index) => (
                                      <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-700 dark:text-gray-300 truncate">
                                          {index + 1}. {attendee.studentName}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {attendee.attendanceRate.toFixed(1)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Charts Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
              className="border-gray-300 dark:border-gray-600"
            >
              {showAdvancedCharts ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Advanced Charts
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Advanced Charts
                </>
              )}
            </Button>
          </div>

          {/* Advanced Charts */}
          {showAdvancedCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Chart */}
              {analytics.attendanceStats && (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Attendance Overview</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Student attendance distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderAttendanceChart()}
                  </CardContent>
                </Card>
              )}

              {/* Class Performance Chart */}
              {analytics.classPerformance && (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Class Performance</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Performance metrics by class
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderClassPerformanceChart()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Performance Metrics */}
          {user?.role === 'PROFESSOR' && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Performance Metrics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Key indicators of your teaching effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analytics.performanceMetrics.studentEngagement}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Student Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analytics.performanceMetrics.assignmentCompletion}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Assignment Completion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analytics.performanceMetrics.quizPerformance}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Quiz Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {analytics.performanceMetrics.contentConsumption}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Content Consumption</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
