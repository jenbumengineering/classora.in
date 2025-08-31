'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BookOpen, Play, BarChart3, Clock, Users, Target, Zap, Plus, FileText, Code, Search, Filter, CheckCircle, Upload, X, Download, Eye, Edit, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PracticeStats {
  totalQuestions: number
  completedQuestions: number
  averageScore: number
  timeSpent: number
  recentActivity: any[]
}

interface Class {
  id: string
  name: string
  code: string
  description?: string
  questionCount: number
}

interface PracticeFile {
  id: string
  title: string
  description: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  classId: string
  className: string
  uploadedBy: string
  createdAt: string
  downloadCount: number
}

interface PracticeQuestion {
  id: string
  title: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECTION' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  class: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  timeLimit?: number
  createdAt: string
  _count: {
    attempts: number
  }
}

export default function PracticePage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [practiceFiles, setPracticeFiles] = useState<PracticeFile[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<PracticeQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedClass, setSelectedClass] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    classId: ''
  })
  const [stats, setStats] = useState<PracticeStats>({
    totalQuestions: 0,
    completedQuestions: 0,
    averageScore: 0,
    timeSpent: 0,
    recentActivity: []
  })

  useEffect(() => {
    if (user) {
      if (user.role === 'PROFESSOR') {
        loadTeacherPracticeData()
      } else {
        loadStudentPracticeData()
      }
    }
  }, [user])

  useEffect(() => {
    if (user?.role === 'PROFESSOR') {
      filterQuestions()
    }
  }, [questions, searchTerm, selectedType, selectedClass, selectedDifficulty])

  const loadTeacherPracticeData = async () => {
    if (!user) return

    try {
      await Promise.all([
        loadClasses(),
        loadQuestions(),
        loadPracticeFiles(),
        loadTeacherStats()
      ])
    } catch (error) {
      console.error('Error loading teacher practice data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStudentPracticeData = async () => {
    if (!user) return

    try {
      await Promise.all([
        loadPracticeStats(),
        loadClasses(),
        loadPracticeFiles()
      ])
    } catch (error) {
      console.error('Error loading student practice data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPracticeFiles = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/practice/files', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPracticeFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error loading practice files:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (!uploadFormData.title.trim()) {
      toast.error('Please enter a title for the file')
      return
    }

    if (!uploadFormData.classId) {
      toast.error('Please select a class')
      return
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type. Please upload PDF, Excel, Word, or text files.`)
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
        formData.append('title', uploadFormData.title)
        formData.append('description', uploadFormData.description)
        formData.append('classId', uploadFormData.classId)

        const response = await fetch('/api/practice/files', {
          method: 'POST',
          headers: {
            'x-user-id': user?.id || '',
          },
          body: formData,
        })

        if (response.ok) {
          const uploadedFile = await response.json()
          setPracticeFiles(prev => [uploadedFile, ...prev])
          toast.success(`${file.name} uploaded successfully`)
          // Reset form
          setUploadFormData({
            title: '',
            description: '',
            classId: ''
          })
          // Reset file input
          const fileInput = event.target
          fileInput.value = ''
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

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/practice/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        setPracticeFiles(prev => prev.filter(file => file.id !== fileId))
        toast.success('File deleted successfully')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className="w-4 h-4" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const loadTeacherStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/practice/teacher/stats', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalQuestions: data.totalQuestions,
          completedQuestions: data.totalAttempts,
          averageScore: data.averageScore,
          timeSpent: data.totalTimeSpent,
          recentActivity: data.recentActivity || []
        })
      }
    } catch (error) {
      console.error('Error loading teacher practice stats:', error)
    }
  }

  const loadPracticeStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/practice/stats', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalQuestions: data.totalQuestions,
          completedQuestions: data.completedQuestions,
          averageScore: data.averageScore,
          timeSpent: data.timeSpent,
          recentActivity: data.recentActivity || []
        })
      }
    } catch (error) {
      console.error('Error loading practice stats:', error)
    }
  }

  const loadClasses = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/practice/classes', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadQuestions = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/practice/questions', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error loading practice questions:', error)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(question =>
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(question => question.type === selectedType)
    }

    // Filter by class
    if (selectedClass !== 'All') {
      filtered = filtered.filter(question => question.class === selectedClass)
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(question => question.difficulty === selectedDifficulty)
    }

    setFilteredQuestions(filtered)
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
              <h1 className="text-3xl font-bold text-gray-900">Practice</h1>
              <p className="text-gray-600 mt-2">
                {user?.role === 'PROFESSOR' 
                  ? 'Upload practice files and manage questions for your students'
                  : 'Access practice materials and test your knowledge'
                }
              </p>
            </div>

            {user?.role === 'PROFESSOR' ? (
              // Teacher View
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Questions</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.completedQuestions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Avg Score</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Time Spent</p>
                          <p className="text-2xl font-bold text-gray-900">{Math.round(stats.timeSpent / 60)}m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* File Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Practice Files</CardTitle>
                    <CardDescription>Upload PYQs, practice questions, or study materials for your students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={uploadFormData.title}
                            onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter file title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Class *
                          </label>
                          <select
                            value={uploadFormData.classId}
                            onChange={(e) => setUploadFormData({ ...uploadFormData, classId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a class</option>
                            {classes.map((classData) => (
                              <option key={classData.id} value={classData.id}>
                                {classData.code} - {classData.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={uploadFormData.description}
                            onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter description"
                          />
                        </div>
                      </div>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="practice-file-upload"
                          disabled={isUploading}
                        />
                        <label htmlFor="practice-file-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {isUploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, Excel, Word, Text files up to 10MB
                          </p>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Practice Files Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Files</CardTitle>
                    <CardDescription>Manage uploaded practice materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {practiceFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No practice files uploaded yet. Upload your first file to get started.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Title</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Class</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">File</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Uploaded</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Downloads</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {practiceFiles.map((file) => (
                              <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{file.title}</div>
                                    {file.description && (
                                      <div className="text-sm text-gray-500">{file.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-medium text-gray-900">{file.className}</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center">
                                    {getFileIcon(file.fileType)}
                                    <div className="ml-2">
                                      <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                                      <div className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(file.createdAt).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-sm text-gray-600">{file.downloadCount} downloads</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button asChild variant="ghost" size="sm">
                                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    <Button asChild variant="ghost" size="sm">
                                      <a href={file.fileUrl} download>
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteFile(file.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Student View
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Questions</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Completed</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.completedQuestions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Avg Score</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Time Spent</p>
                          <p className="text-2xl font-bold text-gray-900">{Math.round(stats.timeSpent / 60)}m</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Practice Files for Students */}
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Materials</CardTitle>
                    <CardDescription>Download practice files and study materials from your professors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {practiceFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No practice files available yet. Check back later for study materials.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Title</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Class</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">File</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Uploaded</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {practiceFiles.map((file) => (
                              <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{file.title}</div>
                                    {file.description && (
                                      <div className="text-sm text-gray-500">{file.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-medium text-gray-900">{file.className}</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center">
                                    {getFileIcon(file.fileType)}
                                    <div className="ml-2">
                                      <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                                      <div className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(file.createdAt).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center justify-end space-x-2">
                                    <Button asChild variant="ghost" size="sm">
                                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    <Button asChild variant="ghost" size="sm">
                                      <a href={file.fileUrl} download>
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Practice Classes */}
                {classes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Practice Classes</CardTitle>
                      <CardDescription>Start practicing with questions from your enrolled classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls) => (
                          <Card key={cls.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span className="truncate">{cls.name}</span>
                                <span className="text-sm font-normal text-gray-500">{cls.code}</span>
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                <div 
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: cls.description || 'No description available' }}
                                />
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <Target className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {cls.questionCount} questions
                                  </span>
                                </div>
                              </div>
                              <Button asChild className="w-full">
                                <Link href={`/dashboard/practice/classes/${cls.id}`}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Practice
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
