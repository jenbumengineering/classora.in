'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, Upload, Calendar, BookOpen, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import SunEditor from 'suneditor-react'
import 'suneditor/dist/css/suneditor.min.css'

interface Class {
  id: string
  name: string
  code: string
}

interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  dueDate: string | null
  category: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  fileUrl: string | null
  class: {
    id: string
    name: string
    code: string
  }
}

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    category: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null)

  const assignmentId = params.id as string

  useEffect(() => {
    if (user && assignmentId) {
      loadAssignment()
      loadClasses()
    }
  }, [user, assignmentId])

  const loadAssignment = async () => {
    if (!user || user.role !== 'PROFESSOR') return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAssignment(data)
        setFormData({
          title: data.title,
          description: data.description || '',
          classId: data.classId,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '',
          category: data.category || '',
          status: data.status
        })
        setCurrentFileUrl(data.fileUrl)
      } else {
        toast.error('Failed to load assignment')
        router.push('/dashboard/assignments')
      }
    } catch (error) {
      console.error('Error loading assignment:', error)
      toast.error('Failed to load assignment')
      router.push('/dashboard/assignments')
    } finally {
      setIsLoadingAssignment(false)
    }
  }

  const loadClasses = async () => {
    if (!user || user.role !== 'PROFESSOR') return

    try {
      const response = await fetch(`/api/classes?professorId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      } else {
        console.error('Failed to load classes')
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setIsLoadingClasses(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleFileInputClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent, status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED') => {
    e.preventDefault()
    
    // Enhanced validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.classId) {
      toast.error('Please select a class')
      return
    }

    // Validate due date if provided
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate)
      const now = new Date()
      if (dueDate <= now) {
        toast.error('Due date must be in the future')
        return
      }
    }

    setIsLoading(true)

    try {
      // Upload file if selected
      let fileUrl = currentFileUrl
      if (selectedFile) {
        fileUrl = await uploadFile()
        if (!fileUrl) {
          setIsLoading(false)
          return
        }
      }

      // Prepare the data to send
      const assignmentData = {
        title: formData.title.trim(),
        description: formData.description || '',
        classId: formData.classId,
        dueDate: formData.dueDate || undefined,
        status: status || formData.status, // Use the passed status or fall back to form data
        fileUrl: fileUrl || undefined,
        category: formData.category.trim() || undefined
      }

      // Update assignment
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(assignmentData),
      })

      if (response.ok) {
        const statusMessage = status === 'PUBLISHED' ? 'published' : 'updated'
        toast.success(`Assignment ${statusMessage} successfully!`)
        router.push('/dashboard/assignments')
      } else {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        
        if (errorData.details) {
          // Handle validation errors from the server
          const errorMessages = errorData.details.map((detail: any) => detail.message).join(', ')
          toast.error(`Validation error: ${errorMessages}`)
        } else {
          throw new Error(errorData.error || 'Failed to update assignment')
        }
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update assignment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    await handleSubmit(new Event('submit') as any, 'DRAFT')
  }

  const handlePublish = async () => {
    await handleSubmit(new Event('submit') as any, 'PUBLISHED')
  }

  if (user?.role !== 'PROFESSOR') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only professors can edit assignments.</p>
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

  if (isLoadingAssignment) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignment Not Found</h2>
            <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/assignments">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignments
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
        userRole="PROFESSOR"
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
                  <Link href="/dashboard/assignments">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Assignments
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
                <p className="text-gray-600 mt-2">Update assignment details and materials</p>
              </div>
            </div>

            <div className="max-w-4xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Information</CardTitle>
                    <CardDescription>Update the basic details of your assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter assignment title"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <SunEditor
                        setContents={formData.description}
                        onChange={(content) => {
                          // Use a callback to ensure we're updating the correct field
                          setFormData(prevData => ({
                            ...prevData,
                            description: content
                          }))
                        }}
                        setOptions={{
                          height: '200',
                          buttonList: [
                            ['undo', 'redo'],
                            ['font', 'fontSize', 'formatBlock'],
                            ['bold', 'underline', 'italic', 'strike'],
                            ['removeFormat'],
                            ['fontColor', 'hiliteColor'],
                            ['align', 'list', 'lineHeight'],
                            ['table', 'link', 'image'],
                            ['fullScreen', 'showBlocks', 'codeView'],
                            ['preview']
                          ],
                          placeholder: 'Enter assignment description...'
                        }}
                      />
                    </div>

                    {/* Class Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class *
                      </label>
                      {isLoadingClasses ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner size="sm" />
                          <span className="text-sm text-gray-600">Loading classes...</span>
                        </div>
                      ) : (
                        <select
                          value={formData.classId}
                          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a class</option>
                          {classes.map(classItem => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.code} - {classItem.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Homework, Project, Exam"
                      />
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>


                  </CardContent>
                </Card>

                {/* File Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment File</CardTitle>
                    <CardDescription>Update assignment instructions or materials (optional)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current File */}
                      {currentFileUrl && !selectedFile && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-700">Current file attached</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentFileUrl(null)}
                              className="text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* File Upload Area */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX, or image files (max 10MB)</p>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                            className="hidden"
                            id="file-upload"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleFileInputClick}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>

                      {/* Selected File Preview */}
                      {selectedFile && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{selectedFile.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

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
                    Publish Assignment
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/dashboard/assignments')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
