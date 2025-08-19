'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Users, Search, Mail, GraduationCap, BarChart3 } from 'lucide-react'
import { Avatar } from '@/lib/avatar'
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
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and view your students</p>
          </div>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link href="/dashboard/students/invite">
              <Users className="w-4 h-4 mr-2" />
              Invite Students
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'No students found' : 'No students yet'}
                </h3>
                <p className="mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search criteria to find more students'
                    : 'Invite students to your classes to start building your learning community'
                  }
                </p>
                {!searchTerm && (
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link href="/dashboard/students/invite">
                      <Users className="w-4 h-4 mr-2" />
                      Invite Your First Students
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar 
                      src={student.avatar} 
                      alt={student.name} 
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-gray-900 dark:text-white truncate">{student.name}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 truncate">{student.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <GraduationCap className="w-4 h-4" />
                      <span>{student.enrolledClasses} classes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <BarChart3 className="w-4 h-4" />
                      <span>{student.averageGrade}% avg</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Last active: {new Date(student.lastActive).toLocaleDateString()}
                    </span>
                    <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Link href={`/dashboard/students/${student.id}`}>
                        <Mail className="w-4 h-4 mr-1" />
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
