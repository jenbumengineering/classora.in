'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BarChart3, TrendingUp, Users, BookOpen, Code, FileText, Calendar } from 'lucide-react'

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
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role as 'STUDENT' | 'PROFESSOR' || 'STUDENT'}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-2">Track your teaching performance and student engagement</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageGrade}%</div>
                  <p className="text-xs text-muted-foreground">
                    Across all assessments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Assignment completion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Content Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{analytics.totalNotes}</div>
                  <p className="text-sm text-gray-600 mb-4">Published notes</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((analytics.totalNotes / Math.max(analytics.totalClasses, 1)) * 100, 100)}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Quizzes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{analytics.totalQuizzes}</div>
                  <p className="text-sm text-gray-600 mb-4">Active quizzes</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((analytics.totalQuizzes / Math.max(analytics.totalClasses, 1)) * 100, 100)}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Assignments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{analytics.totalAssignments}</div>
                  <p className="text-sm text-gray-600 mb-4">Active assignments</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((analytics.totalAssignments / Math.max(analytics.totalClasses, 1)) * 100, 100)}%` }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Student engagement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : analytics.monthlyStats.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No data available</p>
                        <p className="text-sm">Monthly trends will appear here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64">
                      <div className="flex items-end justify-between h-48 mb-4">
                        {analytics.monthlyStats.map((stat, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="text-xs text-gray-600 mb-2">{stat.students}</div>
                            <div 
                              className="w-8 bg-blue-500 rounded-t"
                              style={{ 
                                height: `${Math.max((stat.students / Math.max(...analytics.monthlyStats.map(s => s.students))) * 120, 8)}px` 
                              }}
                            ></div>
                            <div className="text-xs text-gray-500 mt-2">{stat.month}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        Student enrollments over the last 6 months
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Student Engagement</span>
                        <span className="text-sm text-gray-600">{analytics.performanceMetrics.studentEngagement}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${analytics.performanceMetrics.studentEngagement}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Assignment Completion</span>
                        <span className="text-sm text-gray-600">{analytics.performanceMetrics.assignmentCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${analytics.performanceMetrics.assignmentCompletion}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Quiz Performance</span>
                        <span className="text-sm text-gray-600">{analytics.performanceMetrics.quizPerformance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${analytics.performanceMetrics.quizPerformance}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Content Consumption</span>
                        <span className="text-sm text-gray-600">{analytics.performanceMetrics.contentConsumption}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${analytics.performanceMetrics.contentConsumption}%` }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
