'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  BookOpen, 
  Code, 
  FileText, 
  Users, 
  BarChart3, 
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  Calendar,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import BasicClassCard from '@/components/classes/BasicClassCard'

interface EnrolledClass {
  id: string
  class: {
    id: string
    name: string
    code: string
    description?: string
    isPrivate: boolean
    isArchived: boolean
    archivedAt?: string
    createdAt: string
    professor: {
      id: string
      name: string
      email: string
      avatar?: string
      teacherProfile?: {
        university?: string
        department?: string
      }
    }
    _count: {
      enrollments: number
      notes: number
      quizzes: number
      assignments: number
    }
  }
  enrolledAt: string
}

export function StudentDashboard() {
  const { user } = useAuth()
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    enrolledClasses: 0,
    completedQuizzes: 0,
    totalQuizzes: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    averageScore: 0,
    studyStreak: 0,
    upcomingDeadlines: 0
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      loadEnrolledClasses()
      loadStudentStats()
    }
  }, [user])

  const loadEnrolledClasses = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/enrollments?studentId=${user.id}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setEnrolledClasses(data.enrollments || [])
        // Load detailed stats from the stats API
        loadStudentStats()
      }
    } catch (error) {
      console.error('Error loading enrolled classes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStudentStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/student/stats', {
        headers: {
          'x-user-id': user.id,
        },
        cache: 'no-store' // Force fresh data
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          enrolledClasses: data.enrolledClasses,
          completedQuizzes: data.completedQuizzes,
          totalQuizzes: data.totalQuizzes,
          completedAssignments: data.completedAssignments,
          totalAssignments: data.totalAssignments,
          averageScore: data.averageScore,
          studyStreak: data.studyStreak,
          upcomingDeadlines: data.upcomingDeadlines
        })
        setRecentActivity(data.recentActivity || [])
        setUpcomingDeadlines(data.upcomingDeadlinesList || [])
      }
    } catch (error) {
      console.error('Error loading student stats:', error)
    }
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Keep up the great work! You're on a {stats.studyStreak}-day study streak.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Enrolled Classes</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.enrolledClasses}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active classes</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Quiz Progress</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.completedQuizzes}/{stats.totalQuizzes}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)}% completed</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Code className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.averageScore}%</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Across all quizzes</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Upcoming Deadlines</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.upcomingDeadlines}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Next 7 days</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">My Classes</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your enrolled classes and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : enrolledClasses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-medium mb-2">No enrolled classes yet</h3>
                    <p className="mb-4">Browse and enroll in classes to start your learning journey.</p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Link href="/classes">
                        Browse Classes
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledClasses.map((enrollment) => (
                    <BasicClassCard 
                      key={enrollment.id} 
                      classData={enrollment.class}
                    />
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/classes">Browse More Classes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Upcoming Deadlines</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Due in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {deadline.type === 'quiz' && <Code className="h-4 w-4 text-blue-500 mt-1" />}
                      {deadline.type === 'assignment' && <FileText className="h-4 w-4 text-green-500 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {deadline.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {deadline.class} • Due {deadline.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/dashboard/calendar">View Calendar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your latest learning activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'quiz' && <Code className="h-4 w-4 text-blue-500" />}
                  {activity.type === 'assignment' && <FileText className="h-4 w-4 text-green-500" />}
                  {activity.type === 'note' && <BookOpen className="h-4 w-4 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.class} • {activity.time}
                    {activity.score && ` • Score: ${activity.score}%`}
                  </p>
                </div>
                {activity.type === 'quiz' && activity.score && (
                  <div className="flex-shrink-0">
                    <span className={`text-sm font-medium ${
                      activity.score >= 80 ? 'text-green-600 dark:text-green-400' : 
                      activity.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {activity.score}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
} 