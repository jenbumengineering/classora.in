'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SunEditorComponent } from '@/components/ui/SunEditor'
import { ArrowLeft, Save, Eye, EyeOff, BookOpen } from 'lucide-react'
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

export default function EditNotePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [note, setNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'PRIVATE'
  })

  const noteId = params.id as string

  useEffect(() => {
    if (noteId && user?.role === 'PROFESSOR') {
      loadNote()
    }
  }, [noteId, user])

  const loadNote = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`)
      if (response.ok) {
        const noteData = await response.json()
        setNote(noteData)
        setFormData({
          title: noteData.title,
          content: noteData.content,
          status: noteData.status
        })
      } else {
        toast.error('Note not found')
        router.push('/dashboard/notes')
      }
    } catch (error) {
      console.error('Error loading note:', error)
      toast.error('Failed to load note')
      router.push('/dashboard/notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Please enter content')
      return
    }

    setIsSaving(true)

    try {
      const updateData = status ? { ...formData, status } : formData
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedNote = await response.json()
        setNote(updatedNote)
        toast.success('Note updated successfully!')
        router.push('/dashboard/notes')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    setFormData(prev => ({ ...prev, status: 'DRAFT' }))
    await handleSubmit(new Event('submit') as any, 'DRAFT')
  }

  const handlePublish = async () => {
    setFormData(prev => ({ ...prev, status: 'PUBLISHED' }))
    await handleSubmit(new Event('submit') as any, 'PUBLISHED')
  }

  const handlePrivate = async () => {
    setFormData(prev => ({ ...prev, status: 'PRIVATE' }))
    await handleSubmit(new Event('submit') as any, 'PRIVATE')
  }

  if (user?.role !== 'PROFESSOR') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only professors can edit notes.</p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
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

  if (!note) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Note Not Found</h2>
            <p className="text-gray-600 mb-6">The note you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/notes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Notes
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
                  <Link href="/dashboard/notes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Notes
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Note</h1>
                <p className="text-gray-600 mt-2">Update your note content and settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Note Details</CardTitle>
                    <CardDescription>Update your note content and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Class Information */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-md">
                          <p className="text-gray-900">{note.class.code} - {note.class.name}</p>
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter note title"
                          required
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content *
                        </label>
                                    <SunEditorComponent
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Enter note content..."
            />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isSaving}
                          variant="outline"
                        >
                          {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                          Save as Draft
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePublish}
                          disabled={isSaving}
                        >
                          {isSaving ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4 mr-2" />}
                          Publish Note
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePrivate}
                          disabled={isSaving}
                          variant="outline"
                        >
                          {isSaving ? <LoadingSpinner size="sm" /> : <EyeOff className="w-4 h-4 mr-2" />}
                          Save as Private
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => router.push('/dashboard/notes')}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Note Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Note Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
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
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm font-medium">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-sm font-medium">{new Date(note.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Note Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Draft</span>
                      <span className="text-xs text-gray-500">- Only you can see this</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Published</span>
                      <span className="text-xs text-gray-500">- Students can see this</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Private</span>
                      <span className="text-xs text-gray-500">- Only you can see this</span>
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
