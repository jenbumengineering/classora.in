'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Users, Search, Mail, GraduationCap, BarChart3, Filter, ChevronDown } from 'lucide-react'
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
  classes?: Array<{
    id: string
    name: string
    code: string
  }>
}

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'class' | 'grade' | 'lastActive'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string, name: string, code: string}>>([])

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
        
        // Extract unique classes from students
        const classes = new Map<string, {id: string, name: string, code: string}>()
        data.students?.forEach((student: Student) => {
          student.classes?.forEach((cls) => {
            classes.set(cls.id, cls)
          })
        })
        setAvailableClasses(Array.from(classes.values()))
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

  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesClass = selectedClass === 'all' || 
                          student.classes?.some(cls => cls.id === selectedClass)
      
      return matchesSearch && matchesClass
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'grade':
          aValue = a.averageGrade
          bValue = b.averageGrade
          break
        case 'lastActive':
          aValue = new Date(a.lastActive).getTime()
          bValue = new Date(b.lastActive).getTime()
          break
        case 'class':
          // Sort by first class name
          aValue = a.classes?.[0]?.name?.toLowerCase() || ''
          bValue = b.classes?.[0]?.name?.toLowerCase() || ''
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

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
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
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
          
          {/* Filters and Sorting */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Class Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Classes</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} - {cls.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'class' | 'grade' | 'lastActive')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Name</option>
                <option value="class">Class</option>
                <option value="grade">Grade</option>
                <option value="lastActive">Last Active</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-gray-300 dark:border-gray-600"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredAndSortedStudents.length === 0 ? (
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
            {filteredAndSortedStudents.map((student) => (
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
                  
                  {/* Class Information */}
                  {student.classes && student.classes.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enrolled Classes:</div>
                      <div className="flex flex-wrap gap-1">
                        {student.classes.slice(0, 3).map((cls) => (
                          <span
                            key={cls.id}
                            className="inline-block px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full"
                          >
                            {cls.code}
                          </span>
                        ))}
                        {student.classes.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            +{student.classes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
