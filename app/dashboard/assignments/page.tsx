'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ResizableTable, Column } from '@/components/ui/ResizableTable'
import { FileText, Plus, Edit, Trash2, Calendar as CalendarIcon, Users, Eye, Clock, Target, MoreHorizontal, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  className: string
  dueDate: string | null
  category: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  createdAt: string
  class?: {
    id: string
    name: string
    gradientColor: string
  }
  submissions?: { id: string }[]
  _count?: {
    submissions: number
  }
  points?: number
  // Student-specific fields
  submitted?: boolean
  graded?: boolean
  grade?: number | null
}

export default function AssignmentsPage() {
  const { user, loading } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()





  useEffect(() => {
    if (user) {
      loadAssignments()
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        // Close all dropdowns
        const dropdowns = document.querySelectorAll('[id^="assignments-dropdown-"]')
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

  const loadAssignments = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams()
      
      if (user.role === 'PROFESSOR') {
        params.append('professorId', user.id)
      } else {
        params.append('status', 'PUBLISHED')
      }

      const response = await fetch(`/api/assignments?${params}`, {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        console.error('Failed to load assignments')
        setAssignments([])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      setAssignments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        toast.success('Assignment deleted successfully!')
        loadAssignments() // Reload the assignments list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete assignment')
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

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const columns: Column[] = [
    {
      key: 'title',
      label: 'Assignment Name',
      width: 250,
      minWidth: 200,
      maxWidth: 400,
      visible: true,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <FileText className="w-5 h-5 text-green-500" />
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
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
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
      key: 'category',
      label: 'Category',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      visible: true,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {row.category || 'General'}
          </div>
        </div>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      visible: true,
      sortable: true,
      render: (value, row) => {
        const dueDate = row.dueDate ? new Date(row.dueDate) : null
        const now = new Date()
        const isOverdue = dueDate && dueDate < now
        const isDueSoon = dueDate && dueDate > now && dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000 // 24 hours
        
        // For students, show appropriate status badges
        if (user?.role === 'STUDENT') {
          return (
            <div className="flex items-center space-x-2">
              {dueDate ? (
                <>
                  <CalendarIcon className={`w-4 h-4 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-yellow-500' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : isDueSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {dueDate.toLocaleDateString()}
                  </span>
                  {row.graded && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Graded ({row.grade || 0})
                    </span>
                  )}
                  {row.submitted && !row.graded && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Submitted
                    </span>
                  )}
                  {!row.submitted && isOverdue && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Overdue
                    </span>
                  )}
                  {!row.submitted && isDueSoon && !isOverdue && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Due Soon
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">No due date</span>
              )}
            </div>
          )
        }
        
        // For professors, show overdue/due soon badges
        return (
          <div className="flex items-center space-x-2">
            {dueDate ? (
              <>
                <CalendarIcon className={`w-4 h-4 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-yellow-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : isDueSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {dueDate.toLocaleDateString()}
                </span>
                {isOverdue && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Overdue
                  </span>
                )}
                {isDueSoon && !isOverdue && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Due Soon
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">No due date</span>
            )}
          </div>
        )
      }
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
      key: 'submissions',
      label: 'Submissions',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      visible: false,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row._count?.submissions || 0}
          </span>
        </div>
      )
    },
    {
      key: 'points',
      label: 'Points',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      visible: false,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row.points || 0}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      visible: false,
      sortable: true,
      render: (value, row) => {
        const hasSubmission = row.submissions && row.submissions.length > 0
        return (
          <div className="flex items-center space-x-2">
            {hasSubmission ? (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Submitted
              </div>
            ) : (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                Not Submitted
              </div>
            )}
          </div>
        )
      }
    },

  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Create and manage assignments for your students' 
                : 'View assignments from your enrolled classes'
              }
            </p>
          </div>
          {user?.role === 'PROFESSOR' && (
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/dashboard/assignments/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
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
        ) : assignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium mb-2">
                {user?.role === 'PROFESSOR' ? 'No assignments yet' : 'No assignments available'}
              </h3>
              <p className="mb-4">
                {user?.role === 'PROFESSOR' 
                  ? 'Create your first assignment to engage your students'
                  : 'Assignments will appear here once your professors create them'
                }
              </p>
              {user?.role === 'PROFESSOR' && (
                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/dashboard/assignments/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Assignment
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ResizableTable
            columns={columns}
            data={assignments}
            title="Assignments List"
            description={`${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} found`}
            onRowClick={(row) => {
              router.push(`/dashboard/assignments/${row.id}`)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
