'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Users, Search, Mail, GraduationCap, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
  enrolledClasses: number
  averageGrade: number
  lastActive: string
  avatar?: string
}

export default function StudentsPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/students', {
        headers: {
          'x-user-id': user.id
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('Failed to load students')
        setStudents([])
      }
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                <p className="text-gray-600 mt-2">Manage and view your students</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/students/invite">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Students
                </Link>
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{students.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, student) => sum + student.averageGrade, 0) / students.length)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all students
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {students.filter(student => 
                      new Date(student.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active in last 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : students.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No students yet</h3>
                    <p className="mb-4">Students will appear here once they enroll in your classes.</p>
                    <Button asChild>
                      <Link href="/classes">
                        View My Classes
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{student.email}</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>{student.enrolledClasses} classes</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <BarChart3 className="w-4 h-4" />
                          <span>{student.averageGrade}% avg</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Last active: {new Date(student.lastActive).toLocaleDateString()}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/students/${student.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
