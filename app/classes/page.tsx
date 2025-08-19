'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import BasicClassCard from '@/components/classes/BasicClassCard'
import CreateClassForm from '@/components/classes/CreateClassForm'
import { useAuth } from '@/components/providers/AuthProvider'
import { Search, Plus, Filter, X, Users } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
  description?: string
  isPrivate: boolean
  isArchived: boolean
  archivedAt?: string
  createdAt: string
  professor: {
    id: string
    name: string
    email: string
    avatar?: string
    teacherProfile?: {
      university?: string
      department?: string
    }
  }
  _count: {
    enrollments: number
    notes: number
    quizzes: number
    assignments: number
  }
}

interface ClassesResponse {
  classes: Class[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfessor, setSelectedProfessor] = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [includePrivate, setIncludePrivate] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([])
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    loadClasses()
    if (user?.role === 'STUDENT') {
      loadEnrolledClasses()
    }
  }, [user, searchQuery, selectedProfessor, selectedUniversity, includeArchived, includePrivate])

  const loadClasses = async (offset = 0) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      })

      if (searchQuery) {
        params.append('query', searchQuery)
      }

      if (selectedProfessor) {
        params.append('professorId', selectedProfessor)
      }

      if (selectedUniversity) {
        params.append('university', selectedUniversity)
      }

      if (includeArchived) {
        params.append('includeArchived', 'true')
      }

      if (!includePrivate) {
        params.append('publicOnly', 'true')
      }

      const response = await fetch(`/api/classes?${params.toString()}`)
      if (response.ok) {
        const data: ClassesResponse = await response.json()
        if (offset === 0) {
          setClasses(data.classes)
        } else {
          setClasses(prev => [...prev, ...data.classes])
        }
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadEnrolledClasses = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/enrollments?studentId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const enrolledIds = data.enrollments?.map((enrollment: any) => enrollment.class.id) || []
        setEnrolledClasses(enrolledIds)
      }
    } catch (error) {
      console.error('Error loading enrolled classes:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, offset: 0 }))
    loadClasses(0)
  }

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      loadClasses(pagination.offset + pagination.limit)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreating(false)
    toast.success('Class created successfully!')
    loadClasses(0)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedProfessor('')
    setSelectedUniversity('')
    setIncludeArchived(false)
    setIncludePrivate(true)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleEnroll = async (classId: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          classId,
          studentId: user.id,
        }),
      })

      if (response.ok) {
        toast.success('Successfully enrolled in class!')
        setEnrolledClasses(prev => [...prev, classId])
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to enroll in class')
      }
    } catch (error) {
      console.error('Error enrolling in class:', error)
      toast.error('Failed to enroll in class')
    }
  }

  if (isCreating) {
    return (
      <DashboardLayout>
        <CreateClassForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreating(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Manage your classes and create new ones'
                : 'Browse and enroll in classes from top professors'
              }
            </p>
          </div>
          {user?.role === 'STUDENT' && (
            <Button asChild variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Link href="/teachers">
                <Users className="w-4 h-4 mr-2" />
                Browse Professors
              </Link>
            </Button>
          )}
          {user?.role === 'PROFESSOR' && (
            <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search classes by name, code, or professor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Filter by university/college..."
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Include archived classes</span>
                </label>
                {user?.role === 'STUDENT' && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includePrivate}
                      onChange={(e) => setIncludePrivate(e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">Include private classes</span>
                  </label>
                )}
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedProfessor || selectedUniversity || includeArchived || !includePrivate) && (
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-1 hover:text-orange-600 dark:hover:text-orange-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedProfessor && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                      Professor: {selectedProfessor}
                      <button
                        onClick={() => setSelectedProfessor('')}
                        className="ml-1 hover:text-purple-600 dark:hover:text-purple-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedUniversity && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      University: {selectedUniversity}
                      <button
                        onClick={() => setSelectedUniversity('')}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {includeArchived && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                      Archived classes included
                      <button
                        onClick={() => setIncludeArchived(false)}
                        className="ml-1 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {!includePrivate && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      Public classes only
                      <button
                        onClick={() => setIncludePrivate(true)}
                        className="ml-1 hover:text-green-600 dark:hover:text-green-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery || selectedProfessor ? 'No classes found' : 'Welcome to Classora.in!'}
                </h3>
                <p>
                  {searchQuery || selectedProfessor || selectedUniversity
                    ? 'Try adjusting your search criteria to find more classes'
                    : user?.role === 'PROFESSOR'
                      ? 'Create your first class to start teaching and sharing knowledge with students'
                      : 'Browse and enroll in classes from top professors to enhance your learning journey'
                  }
                </p>
                {!searchQuery && !selectedProfessor && !selectedUniversity && user?.role === 'PROFESSOR' && (
                  <div className="mt-4">
                    <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Class
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {classes.map((classData) => (
                <BasicClassCard
                  key={classData.id}
                  classData={classData}
                  onEnroll={handleEnroll}
                  isEnrolled={enrolledClasses.includes(classData.id)}
                  onUpdate={() => loadClasses(0)}
                />
              ))}
            </div>

            {pagination.hasMore && (
              <div className="text-center">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  disabled={isLoading}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Load More Classes'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
