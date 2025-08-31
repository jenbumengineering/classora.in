'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ResizableTable, Column } from '@/components/ui/ResizableTable'
import { BookOpen, Plus, Edit, Trash2, Eye, Calendar as CalendarIcon, FileText, MoreHorizontal, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Note {
  id: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED' | 'PRIVATE'
  classId: string
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    code: string
    gradientColor?: string
    subject?: string
  }
  professor: {
    id: string
    name: string
    email: string
  }
  tags?: string[]
}

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        // Close all dropdowns
        const dropdowns = document.querySelectorAll('[id^="notes-dropdown-"]')
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

  const loadNotes = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams()
      
      if (user.role === 'PROFESSOR') {
        params.append('professorId', user.id)
      } else {
        params.append('status', 'PUBLISHED')
      }

      const response = await fetch(`/api/notes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      } else {
        console.error('Failed to load notes')
        setNotes([])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        toast.success('Note deleted successfully!')
        loadNotes() // Reload the notes list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete note')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Draft' },
      PUBLISHED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Published' },
      PRIVATE: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Private' }
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
      label: 'Title & Content',
      width: 350,
      minWidth: 250,
      maxWidth: 600,
      visible: true,
      sortable: true,
      render: (value, row) => (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <BookOpen className="w-5 h-5 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-1">
              {row.title}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {row.content.replace(/<[^>]*>/g, '').substring(0, 120)}
              {row.content.replace(/<[^>]*>/g, '').length > 120 && '...'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'classInfo',
      label: 'Class Information',
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
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
      key: 'updatedAt',
      label: 'Last Updated',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      visible: false,
      sortable: true,
      render: (value, row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.updatedAt).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'tags',
      label: 'Tags',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      visible: false,
      sortable: false,
      render: (value, row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            row.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">No tags</span>
          )}
        </div>
      )
    },

  ]

  return (
    <DashboardLayout>
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Create and manage your class notes'
                : 'Access notes from your enrolled classes'
              }
            </p>
          </div>
          {user?.role === 'PROFESSOR' && (
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/dashboard/notes/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
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
        ) : notes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium mb-2">
                {user?.role === 'PROFESSOR' ? 'No notes yet' : 'No notes available'}
              </h3>
              <p className="mb-4">
                {user?.role === 'PROFESSOR' 
                  ? 'Create your first note to share knowledge with your students'
                  : 'Notes will appear here once your professors publish them'
                }
              </p>
              {user?.role === 'PROFESSOR' && (
                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/dashboard/notes/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Note
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ResizableTable
            columns={columns}
            data={notes}
            title="Notes List"
            description={`${notes.length} note${notes.length !== 1 ? 's' : ''} found`}
            onRowClick={(row) => {
              router.push(`/dashboard/notes/${row.id}`)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
