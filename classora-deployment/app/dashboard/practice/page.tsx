'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BookOpen, Play, BarChart3, Clock, Users, Target, Zap } from 'lucide-react'
import Link from 'next/link'

interface PracticeStats {
  totalQuestions: number
  completedQuestions: number
  averageScore: number
  timeSpent: number
  recentActivity: any[]
}

interface Class {
  id: string
  name: string
  code: string
  description?: string
  questionCount: number
}

export default function PracticePage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [stats, setStats] = useState<PracticeStats>({
    totalQuestions: 0,
    completedQuestions: 0,
    averageScore: 0,
    timeSpent: 0,
    recentActivity: []
  })

  useEffect(() => {
    if (user) {
      loadPracticeStats()
      loadClasses()
    }
  }, [user])

  const loadPracticeStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/practice/stats', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalQuestions: data.totalQuestions,
          completedQuestions: data.completedQuestions,
          averageScore: data.averageScore,
          timeSpent: data.timeSpent,
          recentActivity: data.recentActivity || []
        })
      }
    } catch (error) {
      console.error('Error loading practice stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadClasses = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/practice/classes', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Practice Center</h1>
                <p className="text-gray-600 mt-2">Sharpen your skills with practice questions and assessments</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedQuestions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Score</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Practice Section */}
            <div className="w-full">
              {/* Practice Questions */}
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Practice Questions</CardTitle>
                      <CardDescription>Practice with questions from past exams and assessments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">By Class</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {classes.length > 0 ? (
                        classes.slice(0, 3).map((classItem) => (
                          <Button 
                            key={classItem.id}
                            asChild 
                            variant="outline" 
                            className="w-full justify-start"
                          >
                            <Link href={`/dashboard/practice/classes/${classItem.id}`}>
                              <BookOpen className="w-4 h-4 mr-2" />
                              {classItem.code} - {classItem.name}
                              <span className="ml-auto text-xs text-gray-500">
                                ({classItem.questionCount} questions)
                              </span>
                            </Link>
                          </Button>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4 text-gray-500">
                          No classes available for practice
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button asChild className="w-full">
                      <Link href="/dashboard/practice/classes">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Browse Classes
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Practice Activity</CardTitle>
                  <CardDescription>Your latest practice sessions and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              activity.isCorrect ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <Target className={`w-4 h-4 ${
                                activity.isCorrect ? 'text-green-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-600">
                                {activity.class} • {activity.difficulty} • {activity.time}
                                {activity.score && ` • Score: ${activity.score}%`}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${
                            activity.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activity.isCorrect ? `+${activity.points || 10} points` : 'Incorrect'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent practice activity</p>
                        <p className="text-sm text-gray-500">Start practicing to see your activity here</p>
                      </div>
                    )}
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
