'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, BarChart3, Users, Clock, Target, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface QuizStats {
  id: string
  title: string
  totalAttempts: number
  averageScore: number
  highestScore: number
  lowestScore: number
  completionRate: number
  averageTimeSpent: number
  questionStats: Array<{
    questionId: string
    questionText: string
    correctAnswers: number
    totalAnswers: number
    successRate: number
  }>
  recentAttempts: Array<{
    id: string
    studentName: string
    score: number
    timeSpent: number
    completedAt: string
  }>
}

export default function QuizStatsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<QuizStats | null>(null)

  const quizId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (user.role !== 'PROFESSOR') {
      router.push('/dashboard')
      return
    }

    loadQuizStats()
  }, [user, router, quizId])

  const loadQuizStats = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/stats`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load quiz statistics')
      }
    } catch (error) {
      console.error('Error loading quiz stats:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load quiz statistics')
      router.push('/dashboard/quizzes')
    } finally {
      setIsLoading(false)
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

  if (!stats) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
            <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/quizzes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quizzes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole="PROFESSOR"
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
              <div className="flex items-center justify-between mb-6">
                <Button asChild variant="outline">
                  <Link href="/dashboard/quizzes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quizzes
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quiz Statistics</h1>
                <p className="text-gray-600 mt-2">Performance analytics for {stats.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Overview Stats */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Total Attempts */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Score */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Target className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Average Score</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Completion Rate */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.completionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Time */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                          <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageTimeSpent / 60)}m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Score Distribution */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                    <CardDescription>Performance range of all attempts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.lowestScore}%</div>
                        <p className="text-sm text-gray-600">Lowest Score</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}%</div>
                        <p className="text-sm text-gray-600">Average Score</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{stats.highestScore}%</div>
                        <p className="text-sm text-gray-600">Highest Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Question Performance</CardTitle>
                    <CardDescription>Success rate for each question</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.questionStats.map((question, index) => (
                        <div key={question.questionId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question.successRate >= 80 ? 'bg-green-100 text-green-800' :
                              question.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {question.successRate.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{question.questionText}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{question.correctAnswers} correct out of {question.totalAnswers} attempts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Attempts */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Attempts</CardTitle>
                    <CardDescription>Latest student submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentAttempts.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No attempts yet</p>
                      ) : (
                        stats.recentAttempts.map((attempt) => (
                          <div key={attempt.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{attempt.studentName}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                                attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {attempt.score}%
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{Math.round(attempt.timeSpent / 60)}m</span>
                              <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
