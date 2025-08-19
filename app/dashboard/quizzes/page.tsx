'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Code, Plus, Edit, Trash2, Play, BarChart3, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Quiz {
  id: string
  title: string
  description: string
  classId: string
  className: string
  totalQuestions: number
  timeLimit: number
  maxAttempts: number
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  createdAt: string
  attempts?: Array<{
    id: string
    score: number
    completedAt: string
  }>
}

export default function QuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)
  
  const isProfessor = user?.role === 'PROFESSOR'
  const isStudent = user?.role === 'STUDENT'

  useEffect(() => {
    if (user) {
      loadQuizzes()
    }
  }, [user])

  const loadQuizzes = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/quizzes', {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      } else {
        console.error('Failed to load quizzes')
        toast.error('Failed to load quizzes')
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
      toast.error('Failed to load quizzes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    setDeletingQuizId(quizId)
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || ''
        }
      })

      if (response.ok) {
        toast.success('Quiz deleted successfully')
        // Remove the quiz from the local state
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete quiz')
    } finally {
      setDeletingQuizId(null)
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isProfessor 
                ? 'Create and manage quizzes for your students' 
                : 'Take quizzes to test your knowledge'
              }
            </p>
          </div>
          {isProfessor && (
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/dashboard/quizzes/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Code className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium mb-2">
                  {isProfessor ? 'No quizzes yet' : 'No quizzes available'}
                </h3>
                <p className="mb-4">
                  {isProfessor 
                    ? 'Create your first quiz to assess your students\' knowledge'
                    : 'Quizzes will appear here once your professors create them'
                  }
                </p>
                {isProfessor && (
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link href="/dashboard/quizzes/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Quiz
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-gray-900 dark:text-white">{quiz.title}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {quiz.className}
                      </CardDescription>
                    </div>
                    {isProfessor && (
                      <div className="flex items-center space-x-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          disabled={deletingQuizId === quiz.id}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          {deletingQuizId === quiz.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {quiz.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Code className="w-4 h-4" />
                      <span>{quiz.totalQuestions} questions</span>
                    </div>
                    {quiz.timeLimit > 0 && (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Play className="w-4 h-4" />
                        <span>{quiz.timeLimit} min</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Link href={`/dashboard/quizzes/${quiz.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {isProfessor && (
                        <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <Link href={`/dashboard/quizzes/${quiz.id}/stats`}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Stats
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
