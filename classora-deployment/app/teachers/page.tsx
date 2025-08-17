'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { useAuth } from '@/components/providers/AuthProvider'
import { Search, Users, BookOpen, GraduationCap, Building, Filter, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Professor {
  id: string
  name: string
  email: string
  university: string
  department: string
  bio: string
  totalClasses: number
  classes: Array<{
    id: string
    name: string
    code: string
    description?: string
    createdAt: string
    _count: {
      enrollments: number
      notes: number
      quizzes: number
      assignments: number
    }
  }>
}

interface ProfessorsResponse {
  professors: Professor[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export default function TeachersPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
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
    loadProfessors()
    if (user?.role === 'STUDENT') {
      loadEnrolledClasses()
    }
  }, [user, searchQuery, selectedUniversity, selectedDepartment])

  const loadProfessors = async (offset = 0) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      })

      if (searchQuery) {
        params.append('query', searchQuery)
      }

      const response = await fetch(`/api/teachers?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load professors')
      }

      const data: ProfessorsResponse = await response.json()
      
      if (offset === 0) {
        setProfessors(data.professors || [])
      } else {
        setProfessors(prev => [...prev, ...(data.professors || [])])
      }
      
      setPagination(data.pagination || {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      })
    } catch (error) {
      console.error('Error loading professors:', error)
      if (offset === 0) {
        toast.error(error instanceof Error ? error.message : 'Failed to load professors')
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
    loadProfessors(0)
  }

  const handleLoadMore = () => {
    const newOffset = pagination.offset + pagination.limit
    loadProfessors(newOffset)
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
    setSelectedUniversity('')
    setSelectedDepartment('')
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const filteredProfessors = professors.filter(professor => {
    if (selectedUniversity && !professor.university.toLowerCase().includes(selectedUniversity.toLowerCase())) {
      return false
    }
    if (selectedDepartment && !professor.department.toLowerCase().includes(selectedDepartment.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role || 'STUDENT'}
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
                  <h1 className="text-3xl font-bold text-gray-900">Browse Professors</h1>
                  <p className="text-gray-600 mt-2">
                    Discover amazing professors and their classes
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/classes">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Classes
                  </Link>
                </Button>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search professors by name, email, or university..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Filter by university..."
                          value={selectedUniversity}
                          onChange={(e) => setSelectedUniversity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Filter by department..."
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <LoadingSpinner size="sm" /> : 'Search'}
                      </Button>
                    </div>

                    {(searchQuery || selectedUniversity || selectedDepartment) && (
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
                        {selectedDepartment && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            Department: {selectedDepartment}
                            <button
                              onClick={() => setSelectedDepartment('')}
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

            {/* Professors Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredProfessors.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery || selectedUniversity || selectedDepartment ? 'No professors found' : 'No professors available'}
                    </h3>
                    <p>
                      {searchQuery || selectedUniversity || selectedDepartment
                        ? 'Try adjusting your search criteria to find more professors'
                        : 'Check back later for new professors and classes'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {filteredProfessors.map((professor) => (
                    <Card key={professor.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{professor.name}</CardTitle>
                            <CardDescription className="text-sm">{professor.email}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-gray-600">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {professor.totalClasses} classes
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* University and Department */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {professor.university}
                          </div>
                          <div className="flex items-center">
                            <GraduationCap className="w-4 h-4 mr-1" />
                            {professor.department}
                          </div>
                        </div>

                        {/* Bio */}
                        {professor.bio && (
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {professor.bio}
                          </p>
                        )}

                        {/* Classes */}
                        {professor.classes.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Classes</h4>
                            <div className="space-y-2">
                              {professor.classes.slice(0, 3).map((cls) => (
                                <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{cls.name}</div>
                                    <div className="text-xs text-gray-600">{cls.code}</div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-xs text-gray-500">
                                      {cls._count.enrollments} students
                                    </div>
                                    {user?.role === 'STUDENT' && (
                                      <Button
                                        size="sm"
                                        variant={enrolledClasses.includes(cls.id) ? "outline" : "default"}
                                        disabled={enrolledClasses.includes(cls.id)}
                                        onClick={() => handleEnroll(cls.id)}
                                      >
                                        {enrolledClasses.includes(cls.id) ? 'Enrolled' : 'Enroll'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {professor.classes.length > 3 && (
                                <div className="text-center">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/teachers/${professor.id}`}>
                                      View all {professor.totalClasses} classes
                                    </Link>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Profile Button */}
                        <div className="pt-2">
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <Link href={`/teachers/${professor.id}`}>
                              View Professor Profile
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {pagination.hasMore && (
                  <div className="text-center">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : 'Load More Professors'}
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
