'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/components/providers/AuthProvider'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateClassFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CreateClassForm({ onSuccess, onCancel }: CreateClassFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isPrivate: false,
    gradientColor: 'from-gray-900 to-black',
    imageUrl: '',
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
  const router = useRouter()
  const { user } = useAuth()

  const handleImageUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      setImagePreview(URL.createObjectURL(file))
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in to create a class')
      return
    }

    if (user.role !== 'PROFESSOR') {
      toast.error('Only professors can create classes')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create class')
      }

      const newClass = await response.json()
      toast.success('Class created successfully!')
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/classes/${newClass.id}`)
      }
    } catch (error) {
      console.error('Error creating class:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create class')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Class</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a new class for your students to enroll in and access your educational content.
        </p>
      </div>

      <div className="px-6 pb-8">
        <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Class Details</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Fill in the details below to create your new class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., CS101"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  A unique code for your class that students will use to enroll.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Describe what students will learn in this class..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Class Image
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Class preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {isUploading ? (
                          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-orange-500 rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isUploading ? 'Uploading...' : 'Click to upload image'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Upload an image for your class. This will be displayed on the class card. If no image is uploaded, the class code will be shown as a placeholder.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Class Theme Color
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {gradientOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                        formData.gradientColor === option.value
                          ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, gradientColor: option.value }))}
                    >
                      <div className={`h-16 rounded-lg ${option.preview} flex items-center justify-center`}>
                        <span className="text-white text-xs font-medium">{option.label}</span>
                      </div>
                      {formData.gradientColor === option.value && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose a theme color for your class card. This will be used for the background and buttons.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make this class private
                </label>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">
                Private classes are only visible to enrolled students and cannot be discovered by other users.
              </p>

              <div className="flex justify-end space-x-3 pt-6">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.name || !formData.code}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoading ? 'Creating...' : 'Create Class'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
