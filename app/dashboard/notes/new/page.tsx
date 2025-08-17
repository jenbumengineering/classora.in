'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

function NewNotePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'PRIVATE'
  })

  const handleContentChange = useCallback((content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }, [])

  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => ({ ...prev, title }))
  }, [])

  const classIdFromQuery = searchParams.get('classId')

  useEffect(() => {
    if (user?.role !== 'PROFESSOR') {
      router.push('/dashboard')
      return
    }

    loadClasses()
  }, [user, router])

  useEffect(() => {
    if (classIdFromQuery && classes.length > 0) {
      const classExists = classes.find(c => c.id === classIdFromQuery)
      if (classExists) {
        setSelectedClassId(classIdFromQuery)
      }
    }
  }, [classIdFromQuery, classes])

  const loadClasses = async () => {
    try {
      const response = await fetch(`/api/classes?professorId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault()
    
    if (!selectedClassId) {
      toast.error('Please select a class')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Please enter content')
      return
    }

    setIsLoading(true)

    try {
      const submitData = status ? { ...formData, status } : formData
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          ...submitData,
          classId: selectedClassId,
        }),
      })

      if (response.ok) {
        const newNote = await response.json()
        toast.success('Note created successfully!')
        router.push(`/dashboard/notes`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create note')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create note')
    } finally {
      setIsLoading(false)
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
            <p className="text-gray-600 mb-6">Only professors can create notes.</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Create New Note</h1>
                <p className="text-gray-600 mt-2">Add a new note to your class</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Note Details</CardTitle>
                    <CardDescription>Fill in the details for your new note</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Class Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class *
                        </label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => setSelectedClassId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a class</option>
                          {classes.map((classData) => (
                            <option key={classData.id} value={classData.id}>
                              {classData.code} - {classData.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
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
              onChange={handleContentChange}
              placeholder="Enter note content..."
            />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isLoading}
                          variant="outline"
                        >
                          {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                          Save as Draft
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePublish}
                          disabled={isLoading}
                        >
                          {isLoading ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4 mr-2" />}
                          Publish Note
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePrivate}
                          disabled={isLoading}
                          variant="outline"
                        >
                          {isLoading ? <LoadingSpinner size="sm" /> : <EyeOff className="w-4 h-4 mr-2" />}
                          Save as Private
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => router.push('/dashboard/notes')}
                          disabled={isLoading}
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

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>• Use clear, descriptive titles</p>
                    <p>• Structure your content with headings</p>
                    <p>• Include code examples when relevant</p>
                    <p>• Save as draft to work on later</p>
                    <p>• Publish when ready for students</p>
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

export default function NewNotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <NewNotePageContent />
    </Suspense>
  )
}
