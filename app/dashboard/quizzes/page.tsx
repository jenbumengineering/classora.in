'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ResizableTable, Column } from '@/components/ui/ResizableTable'
import { Code, Plus, Edit, Trash2, Play, BarChart3, Eye, Clock, Target, CalendarIcon, Users, HelpCircle, MoreHorizontal, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Quiz {
  id: string
  title: string
  description: string
  classId: string
  className: string
  totalQuestions: number
  timeLimit: number

  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  createdAt: string
  attempts?: Array<{
    id: string
    score: number
    completedAt: string
  }>
  _count?: {
    attempts: number
    questions: number
  }
  class?: {
    name: string
    gradientColor: string
    code: string
  }
}

export default function QuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)
  const router = useRouter()
  
  const isProfessor = user?.role === 'PROFESSOR'
  const isStudent = user?.role === 'STUDENT'

  useEffect(() => {
    if (user) {
      loadQuizzes()
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        // Close all dropdowns
        const dropdowns = document.querySelectorAll('[id^="quizzes-dropdown-"]')
        dropdowns.forEach(dropdown => {
          dropdown.classList.add('hidden')
        })
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const loadQuizzes = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams()
      
      if (user.role === 'PROFESSOR') {
        params.append('professorId', user.id)
      } else {
        params.append('status', 'PUBLISHED')
      }

      const response = await fetch(`/api/quizzes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      } else {
        console.error('Failed to load quizzes')
        setQuizzes([])
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
      setQuizzes([])
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Draft' },
      PUBLISHED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Published' },
      CLOSED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Closed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const columns: Column[] = [
    {
      key: 'title',
      label: 'Quiz Name',
      width: 250,
      minWidth: 200,
      maxWidth: 400,
      visible: true,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Code className="w-5 h-5 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
              {row.title}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'className',
      label: 'Class Name',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      visible: true,
      sortable: true,
      render: (value, row) => {
        const classData = row.class || row.className
        const className = classData?.name || classData || 'Unknown Class'
        const classCode = classData?.code || ''
        
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {className}
              </div>
              {classCode && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {classCode}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      visible: true,
      sortable: true,
      render: (value, row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      width: 300,
      minWidth: 200,
      maxWidth: 500,
      visible: false,
      sortable: false,
      render: (value, row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {row.description.replace(/<[^>]*>/g, '').substring(0, 120)}
          {row.description.replace(/<[^>]*>/g, '').length > 120 && '...'}
        </div>
      )
    },
    {
      key: 'attempts',
      label: 'Attempts',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      visible: false,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row._count?.attempts || 0}
          </span>
        </div>
      )
    },
    {
      key: 'questions',
      label: 'Questions',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      visible: false,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row._count?.questions || 0}
          </span>
        </div>
      )
    },

  ]

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
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
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
          </div>
        ) : (
          <ResizableTable
            columns={columns}
            data={quizzes}
            title="Quizzes List"
            description={`${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} found`}
            onRowClick={(row) => {
              router.push(`/dashboard/quizzes/${row.id}`)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
