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
import { ArrowLeft, Save, Eye, EyeOff, BookOpen, Upload, X, FileText, FileSpreadsheet, File } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

function NewNotePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type. Please upload PDF, Excel, or Word files.`)
        continue
      }

      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum file size is 10MB.`)
        continue
      }

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const uploadedFile = await response.json()
          setUploadedFiles(prev => [...prev, uploadedFile])
          toast.success(`${file.name} uploaded successfully`)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`Failed to upload ${file.name}`)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

    // Check if at least content or files are provided
    if (!formData.content.trim() && uploadedFiles.length === 0) {
      toast.error('Please provide either content or upload a file (or both)')
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
          fileIds: uploadedFiles.map(file => file.id),
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
                <p className="text-gray-600 mt-2">Add a new note to your class with content and/or files</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Note Details</CardTitle>
                    <CardDescription>Fill in the details for your new note. You can provide content, upload files, or both.</CardDescription>
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

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Files (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            disabled={isUploading}
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {isUploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PDF, Excel, Word files up to 10MB
                            </p>
                          </label>
                        </div>
                        
                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                            {uploadedFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {getFileIcon(file.type)}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(file.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content (Optional)
                        </label>
                        <SunEditorComponent
                          value={formData.content}
                          onChange={handleContentChange}
                          placeholder="Enter note content... (optional if files are uploaded)"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isLoading || isUploading}
                          variant="outline"
                        >
                          {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                          Save as Draft
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePublish}
                          disabled={isLoading || isUploading}
                        >
                          {isLoading ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4 mr-2" />}
                          Publish Note
                        </Button>
                        <Button
                          type="button"
                          onClick={handlePrivate}
                          disabled={isLoading || isUploading}
                          variant="outline"
                        >
                          {isLoading ? <LoadingSpinner size="sm" /> : <EyeOff className="w-4 h-4 mr-2" />}
                          Save as Private
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => router.push('/dashboard/notes')}
                          disabled={isLoading || isUploading}
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
                    <p>• Provide either content, files, or both</p>
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
