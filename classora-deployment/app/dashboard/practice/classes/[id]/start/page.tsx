'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Play, Clock, Target, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

interface PracticeQuestion {
  id: string
  title: string
  content: string
  type: string
  difficulty: string
  points: number
  timeLimit?: number
}

export default function StartPracticeSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const classId = params.id as string
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classData, setClassData] = useState<Class | null>(null)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [sessionConfig, setSessionConfig] = useState({
    questionCount: 10,
    timeLimit: 30, // minutes
    difficulty: 'ALL' as 'ALL' | 'EASY' | 'MEDIUM' | 'HARD'
  })

  useEffect(() => {
    if (user && classId) {
      loadClassData()
      loadQuestions()
    }
  }, [user, classId])

  const loadClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`)
      if (response.ok) {
        const data = await response.json()
        setClassData(data)
      }
    } catch (error) {
      console.error('Error loading class data:', error)
    }
  }

  const loadQuestions = async () => {
    try {
      const response = await fetch(`/api/practice/questions?classId=${classId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startSession = () => {
    // Filter questions based on difficulty
    let filteredQuestions = questions
    if (sessionConfig.difficulty !== 'ALL') {
      filteredQuestions = questions.filter(q => q.difficulty === sessionConfig.difficulty)
    }

    // Limit to the specified number of questions
    const selectedQuestions = filteredQuestions.slice(0, sessionConfig.questionCount)

    if (selectedQuestions.length === 0) {
      alert('No questions available for the selected criteria.')
      return
    }

    // Store session config in localStorage or state management
    const sessionData = {
      classId,
      questions: selectedQuestions,
      config: sessionConfig,
      startTime: new Date().toISOString()
    }

    // Navigate to the first question
    router.push(`/dashboard/practice/questions/${selectedQuestions[0].id}?session=${encodeURIComponent(JSON.stringify(sessionData))}`)
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

  if (!classData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Not Found</h2>
            <p className="text-gray-600 mb-6">The class you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/practice">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Practice
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Practice Questions</h2>
            <p className="text-gray-600 mb-6">This class doesn't have any practice questions yet.</p>
            <Button asChild>
              <Link href={`/dashboard/practice/classes/${classId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
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
              <div className="flex items-center space-x-4 mb-6">
                <Button asChild variant="outline">
                  <Link href={`/dashboard/practice/classes/${classId}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Class
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Start Practice Session</h1>
                <p className="text-gray-600 mt-2">
                  {classData.code} - {classData.name}
                </p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Session Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Settings</CardTitle>
                    <CardDescription>Configure your practice session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Number of Questions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions
                      </label>
                      <select
                        value={sessionConfig.questionCount}
                        onChange={(e) => setSessionConfig({
                          ...sessionConfig,
                          questionCount: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5 questions</option>
                        <option value={10}>10 questions</option>
                        <option value={15}>15 questions</option>
                        <option value={20}>20 questions</option>
                        <option value={questions.length}>All questions ({questions.length})</option>
                      </select>
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={sessionConfig.difficulty}
                        onChange={(e) => setSessionConfig({
                          ...sessionConfig,
                          difficulty: e.target.value as 'ALL' | 'EASY' | 'MEDIUM' | 'HARD'
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">All difficulties</option>
                        <option value="EASY">Easy only</option>
                        <option value="MEDIUM">Medium only</option>
                        <option value="HARD">Hard only</option>
                      </select>
                    </div>

                    {/* Time Limit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                      </label>
                      <select
                        value={sessionConfig.timeLimit}
                        onChange={(e) => setSessionConfig({
                          ...sessionConfig,
                          timeLimit: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={0}>No time limit</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Summary</CardTitle>
                    <CardDescription>Overview of your practice session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Class:</span>
                      <span className="font-medium">{classData.code} - {classData.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Questions Available:</span>
                      <span className="font-medium">{questions.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Questions in Session:</span>
                      <span className="font-medium">
                        {sessionConfig.questionCount === questions.length 
                          ? questions.length 
                          : Math.min(sessionConfig.questionCount, questions.length)
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Difficulty:</span>
                      <span className="font-medium capitalize">{sessionConfig.difficulty.toLowerCase()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Time Limit:</span>
                      <span className="font-medium">
                        {sessionConfig.timeLimit === 0 ? 'No limit' : `${sessionConfig.timeLimit} minutes`}
                      </span>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={startSession}
                        className="w-full"
                        size="lg"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Practice Session
                      </Button>
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
