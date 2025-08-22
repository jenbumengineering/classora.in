'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Edit, BarChart3, Play, Clock, Code, FileText, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classId: string
  noteId?: string
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    code: string
  }
  professor: {
    id: string
    name: string
    email: string
  }
  questions: Array<{
    id: string
    question: string
    type: string
    points: number
    options?: Array<{
      id: string
      text: string
      isCorrect: boolean
    }>
  }>
  _count: {
    questions: number
    attempts: number
  }
}

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [quiz, setQuiz] = useState<Quiz | null>(null)

  const quizId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    loadQuiz()
  }, [user, router, quizId])

  const loadQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      
      if (response.ok) {
        const quizData = await response.json()
        setQuiz(quizData)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load quiz')
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load quiz')
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

  if (!quiz) {
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
              <div className="flex items-center justify-between mb-6">
                <Button asChild variant="outline">
                  <Link href="/dashboard/quizzes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quizzes
                  </Link>
                </Button>
                {user?.role === 'PROFESSOR' && quiz.professor.id === user.id && (
                  <div className="flex space-x-2">
                    <Button asChild variant="outline">
                      <Link href={`/dashboard/quizzes/${quiz.id}/stats`}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Stats
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Quiz
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{quiz.class.code} - {quiz.class.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{quiz.professor.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(quiz.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Quiz Description</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{quiz.description || 'No description provided.'}</p>
                  </CardContent>
                </Card>

                {/* Questions Preview */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Questions ({quiz._count.questions})</span>
                    </CardTitle>
                    <CardDescription>Preview of quiz questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {quiz.questions.map((question, index) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {question.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{question.question}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{question.points} points</span>
                            {question.type === 'MULTIPLE_CHOICE' && (
                              <span>{question.options?.length || 0} options</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quiz Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        quiz.status === 'PUBLISHED' 
                          ? 'bg-green-500' 
                          : quiz.status === 'DRAFT'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium capitalize">{quiz.status.toLowerCase()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quiz Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Code className="w-4 h-4 text-gray-500" />
                      <span>{quiz._count.questions} questions</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{quiz.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Play className="w-4 h-4 text-gray-500" />
                      <span>{quiz._count.attempts} attempts</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                {user?.role === 'STUDENT' && quiz.status === 'PUBLISHED' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Take Quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href={`/dashboard/quizzes/${quiz.id}/take`}>
                          <Play className="w-4 h-4 mr-2" />
                          Start Quiz
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Professor Actions */}
                {user?.role === 'PROFESSOR' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/dashboard/quizzes/${quiz.id}/stats`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Stats
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Quiz
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
