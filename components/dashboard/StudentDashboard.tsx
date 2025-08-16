'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
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
    professor: {
      id: string
      name: string
      email: string
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole="STUDENT"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                Keep up the great work! You're on a {stats.studyStreak}-day study streak.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrolledClasses}</div>
                  <p className="text-xs text-muted-foreground">
                    Active classes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quiz Progress</CardTitle>
                  <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedQuizzes}/{stats.totalQuizzes}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)}% completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                  <p className="text-xs text-muted-foreground">
                    Across all quizzes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>
                  <p className="text-xs text-muted-foreground">
                    Next 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Enrolled Courses */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>
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
                        <div className="text-gray-500">
                          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium mb-2">No enrolled classes yet</h3>
                          <p className="mb-4">Browse and enroll in classes to start your learning journey.</p>
                          <Button asChild>
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
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/classes">Browse More Classes</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Deadlines */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>
                      Due in the next 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingDeadlines.map((deadline) => (
                        <div key={deadline.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {deadline.type === 'quiz' && <Code className="h-4 w-4 text-blue-600 mt-1" />}
                            {deadline.type === 'assignment' && <FileText className="h-4 w-4 text-green-600 mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {deadline.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {deadline.class} • Due {deadline.dueDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/dashboard/calendar">View Calendar</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest learning activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'quiz' && <Code className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'assignment' && <FileText className="h-4 w-4 text-green-600" />}
                        {activity.type === 'note' && <BookOpen className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.class} • {activity.time}
                          {activity.score && ` • Score: ${activity.score}%`}
                        </p>
                      </div>
                      {activity.type === 'quiz' && activity.score && (
                        <div className="flex-shrink-0">
                          <span className={`text-sm font-medium ${
                            activity.score >= 80 ? 'text-green-600' : 
                            activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
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
          </div>
        </main>
      </div>
    </div>
  )
} 