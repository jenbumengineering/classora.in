'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
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
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {user?.role === 'PROFESSOR' 
            ? 'Track your teaching performance and student engagement' 
            : 'Monitor your learning progress and achievements'
          }
        </p>
      </div>

      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
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
                  <Calendar className="h-4 w-4 text-purple-500" />
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
        )}
      </div>
    </DashboardLayout>
  )
}
