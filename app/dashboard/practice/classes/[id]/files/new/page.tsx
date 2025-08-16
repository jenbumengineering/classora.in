'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Upload, FileText, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

export default function UploadPracticeFilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const classId = params.id as string
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClass, setIsLoadingClass] = useState(true)
  const [classData, setClassData] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (user && classId) {
      loadClassData()
    }
  }, [user, classId])

  const loadClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`)
      if (response.ok) {
        const data = await response.json()
        setClassData(data)
      }
    } catch (error) {
      console.error('Error loading class data:', error)
      toast.error('Failed to load class data')
    } finally {
      setIsLoadingClass(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 50MB for practice materials)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      
      // Check file type (allow common document types)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not supported. Please upload PDF, Word, Excel, or image files.')
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
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.fileUrl
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setIsLoading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload the file
      const fileUrl = await uploadFile()
      
      if (!fileUrl) {
        throw new Error('Failed to upload file')
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Create the practice file record
      const fileData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        fileUrl: fileUrl,
        classId: classId
      }

      const response = await fetch('/api/practice/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(fileData),
      })

      if (response.ok) {
        toast.success('Practice material uploaded successfully!')
        router.push(`/dashboard/practice/classes/${classId}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create practice file record')
      }
    } catch (error) {
      console.error('Error uploading practice material:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload practice material')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  if (user?.role !== 'PROFESSOR') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only professors can upload practice materials.</p>
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
                  <Link href={`/dashboard/practice/classes/${classId}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Class
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Practice Material</h1>
                <p className="text-gray-600 mt-2">
                  {classData ? `${classData.code} - ${classData.name}` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="max-w-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Material Information</CardTitle>
                    <CardDescription>Basic details about your practice material</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Previous Year Questions, Study Guide, Practice Problems"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of the material..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* File Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>
                      Upload PDF, Word, Excel, or image files (max 50MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        selectedFile
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={handleFileInputClick}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                      
                      {selectedFile ? (
                        <div>
                          <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {selectedFile.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Click to upload file
                          </h3>
                          <p className="text-sm text-gray-600">
                            PDF, Word, Excel, or image files up to 50MB
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !selectedFile}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                    Upload Material
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/practice/classes/${classId}`)}
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
