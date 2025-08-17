'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import { BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
  }
  professor: {
    id: string
    name: string
    email: string
  }
}

export default function NotesPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
                <p className="text-gray-600 mt-2">Manage your course notes and materials</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/notes/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                    <p className="mb-4">Create your first note to share with your students.</p>
                    <Button asChild>
                      <Link href="/dashboard/notes/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Note
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => (
                  <Card key={note.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <Link href={`/dashboard/notes/${note.id}`} className="hover:text-blue-600 transition-colors">
                          {note.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>{note.class.code} - {note.class.name}</CardDescription>
                    </CardHeader>
                                <CardContent>
              <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                <RichTextRenderer content={note.content} />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    note.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : note.status === 'DRAFT'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {note.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/notes/${note.id}`}>
                      View
                    </Link>
                  </Button>
                  {user?.role === 'PROFESSOR' && (
                    <>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/notes/${note.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
