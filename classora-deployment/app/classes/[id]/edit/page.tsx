'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ClassData {
  id: string
  name: string
  code: string
  description?: string
  isPrivate: boolean
  gradientColor?: string
  createdAt: string
  professor: {
    id: string
    name: string
    email: string
  }
}

export default function EditClassPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isPrivate: false,
    gradientColor: 'from-gray-900 to-black'
  })

  const gradientOptions = [
    { value: 'from-gray-900 to-black', label: 'Black', preview: 'bg-gradient-to-br from-gray-900 to-black' },
    { value: 'from-blue-800 to-indigo-900', label: 'Blue', preview: 'bg-gradient-to-br from-blue-800 to-indigo-900' },
    { value: 'from-purple-800 to-pink-900', label: 'Purple', preview: 'bg-gradient-to-br from-purple-800 to-pink-900' },
    { value: 'from-green-800 to-emerald-900', label: 'Green', preview: 'bg-gradient-to-br from-green-800 to-emerald-900' },
    { value: 'from-orange-800 to-red-900', label: 'Orange', preview: 'bg-gradient-to-br from-orange-800 to-red-900' },
    { value: 'from-teal-800 to-cyan-900', label: 'Teal', preview: 'bg-gradient-to-br from-teal-800 to-cyan-900' },
    { value: 'from-violet-800 to-purple-900', label: 'Violet', preview: 'bg-gradient-to-br from-violet-800 to-purple-900' },
    { value: 'from-rose-800 to-pink-900', label: 'Rose', preview: 'bg-gradient-to-br from-rose-800 to-pink-900' },
    { value: 'from-sky-800 to-blue-900', label: 'Sky', preview: 'bg-gradient-to-br from-sky-800 to-blue-900' },
    { value: 'from-lime-800 to-green-900', label: 'Lime', preview: 'bg-gradient-to-br from-lime-800 to-green-900' },
    { value: 'from-amber-800 to-orange-900', label: 'Amber', preview: 'bg-gradient-to-br from-amber-800 to-orange-900' }
  ]

  const classId = params.id as string

  useEffect(() => {
    if (classId) {
      loadClassData()
    }
  }, [classId])

  const loadClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Class not found')
          router.push('/classes')
          return
        }
        throw new Error('Failed to load class data')
      }
      const data = await response.json()
      setClassData(data)
      setFormData({
        name: data.name,
        code: data.code,
        description: data.description || '',
        isPrivate: data.isPrivate || false,
        gradientColor: data.gradientColor || 'from-gray-900 to-black'
      })
    } catch (error) {
      console.error('Error loading class:', error)
      toast.error('Failed to load class data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in to edit a class')
      return
    }

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Class name is required')
      return
    }

    if (!formData.code.trim()) {
      toast.error('Class code is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || undefined,
          isPrivate: formData.isPrivate,
          gradientColor: formData.gradientColor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update class')
      }

      toast.success('Class updated successfully!')
      router.push(`/classes/${classId}`)
    } catch (error) {
      console.error('Error updating class:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update class')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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

  if (!classData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Not Found</h2>
            <p className="text-gray-600 mb-6">The class you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/classes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is the professor who owns this class
  if (user?.role !== 'PROFESSOR' || user?.id !== classData.professor.id) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only the class professor can edit this class.</p>
            <Button asChild>
              <Link href={`/classes/${classId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Class
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
                  <Link href={`/classes/${classId}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Class
                  </Link>
                </Button>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Class</h1>
                <p className="text-gray-600 mt-2">Update your class information</p>
              </div>
            </div>

            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                  <CardDescription>
                    Update the details for {classData.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Class Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter class name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                        Class Code *
                      </label>
                      <input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="e.g., CS101"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This code is used by students to enroll in your class
                      </p>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe what students will learn in this class..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional description to help students understand the class content
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Class Theme Color
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {gradientOptions.map((option) => (
                          <div
                            key={option.value}
                            className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                              formData.gradientColor === option.value
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, gradientColor: option.value }))}
                          >
                            <div className={`h-16 rounded-lg ${option.preview} flex items-center justify-center`}>
                              <span className="text-white text-xs font-medium">{option.label}</span>
                            </div>
                            {formData.gradientColor === option.value && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Choose a theme color for your class card. This will be used for the background and buttons.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        name="isPrivate"
                        checked={formData.isPrivate}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                        Make this class private
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 -mt-4">
                      Private classes are only visible to enrolled students and cannot be discovered by other users.
                    </p>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/classes/${classId}`)}
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
