'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        params.append('includePrivate', 'false')
      }

      const response = await fetch(`/api/classes?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load classes')
      }

      const data: ClassesResponse = await response.json()
      
      if (offset === 0) {
        setClasses(data.classes || [])
      } else {
        setClasses(prev => [...prev, ...(data.classes || [])])
      }
      
      setPagination(data.pagination || {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      })
    } catch (error) {
      console.error('Error loading classes:', error)
      // Only show error toast on initial load, not on pagination
      if (offset === 0) {
        toast.error(error instanceof Error ? error.message : 'Failed to load classes')
      }
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
        setEnrolledClasses(data.enrollments.map((e: any) => e.classId))
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
    const newOffset = pagination.offset + pagination.limit
    loadClasses(newOffset)
  }

  const handleCreateSuccess = () => {
    setIsCreating(false)
    loadClasses(0)
    toast.success('Class created successfully!')
  }

  const handleEnroll = async (classId: string) => {
    if (!user) {
      toast.error('You must be logged in to enroll in a class')
      return
    }

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ classId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll')
      }

      setEnrolledClasses(prev => [...prev, classId])
      toast.success('Successfully enrolled in class!')
    } catch (error) {
      console.error('Error enrolling:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to enroll')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedProfessor('')
    setSelectedUniversity('')
    setIncludeArchived(false)
    setIncludePrivate(true)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  if (isCreating) {
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
              <div className="mb-6">
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  className="mb-4"
                >
                  ← Back to Classes
                </Button>
              </div>
              <CreateClassForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreating(false)} />
            </div>
          </main>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Manage your classes and create new ones'
                : 'Browse and enroll in classes from top professors'
              }
            </p>
          </div>
          {user?.role === 'STUDENT' && (
            <Button asChild variant="outline">
              <Link href="/teachers">
                <Users className="w-4 h-4 mr-2" />
                Browse Professors
              </Link>
            </Button>
          )}
          {user?.role === 'PROFESSOR' && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search classes by name, code, or professor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Filter by university/college..."
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>Include Archived</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includePrivate}
                      onChange={(e) => setIncludePrivate(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span>Include Private</span>
                  </label>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Search'}
                </Button>
              </div>

              {(searchQuery || selectedProfessor || selectedUniversity) && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      Search: {searchQuery}
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-1 hover:text-primary-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedProfessor && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      Professor: {selectedProfessor}
                      <button
                        onClick={() => setSelectedProfessor('')}
                        className="ml-1 hover:text-primary-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedUniversity && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      University: {selectedUniversity}
                      <button
                        onClick={() => setSelectedUniversity('')}
                        className="ml-1 hover:text-primary-600"
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
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
                          <div className="text-gray-500">
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
                    <Button onClick={() => setIsCreating(true)}>
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
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Load More Classes'}
              </Button>
            </div>
          )}
        </>
      )}
          </div>
        </main>
      </div>
    </div>
  )
}
