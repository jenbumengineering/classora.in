'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  BookOpen, 
  Code, 
  FileText, 
  Users, 
  BarChart3, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import BasicClassCard from '@/components/classes/BasicClassCard'

interface ProfessorClass {
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

export function ProfessorDashboard() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [classes, setClasses] = useState<ProfessorClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalNotes: 0,
    totalQuizzes: 0,
    totalAssignments: 0,
    activeStudents: 0,
    averageScore: 0,
    pendingSubmissions: 0
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      loadProfessorClasses()
      loadProfessorStats()
    }
  }, [user])

  const loadProfessorClasses = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/classes?professorId=${user.id}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
        
        // Calculate stats from the classes data
        const totalStudents = data.classes?.reduce((sum: number, cls: ProfessorClass) => sum + cls._count.enrollments, 0) || 0
        const totalNotes = data.classes?.reduce((sum: number, cls: ProfessorClass) => sum + cls._count.notes, 0) || 0
        const totalQuizzes = data.classes?.reduce((sum: number, cls: ProfessorClass) => sum + cls._count.quizzes, 0) || 0
        const totalAssignments = data.classes?.reduce((sum: number, cls: ProfessorClass) => sum + cls._count.assignments, 0) || 0
        
                // Load detailed stats from the stats API
        loadProfessorStats()
      }
    } catch (error) {
      console.error('Error loading professor classes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProfessorStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/professor/stats', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalClasses: data.totalClasses,
          totalStudents: data.totalStudents,
          totalNotes: data.totalNotes,
          totalQuizzes: data.totalQuizzes,
          totalAssignments: data.totalAssignments,
          activeStudents: data.totalStudents, // For now, assume all enrolled students are active
          averageScore: data.averageScore,
          pendingSubmissions: data.pendingSubmissions
        })
        setRecentActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error('Error loading professor stats:', error)
    }
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
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                Here's what's happening with your classes today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalClasses}</div>
                  <p className="text-xs text-blue-700">
                    Active classes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{stats.totalStudents}</div>
                  <p className="text-xs text-purple-700">
                    Enrolled students
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{stats.averageScore}%</div>
                  <p className="text-xs text-green-700">
                    Across all quizzes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">{stats.pendingSubmissions}</div>
                  <p className="text-xs text-orange-700">
                    Need grading
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks you can perform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Link href="/classes">
                        <Plus className="h-6 w-6" />
                                                  <span>Create Class</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Link href="/dashboard/notes/new">
                        <BookOpen className="h-6 w-6" />
                        <span>Add Note</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Link href="/dashboard/quizzes/new">
                        <Code className="h-6 w-6" />
                        <span>Create Quiz</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                      <Link href="/dashboard/assignments/new">
                        <FileText className="h-6 w-6" />
                        <span>Add Assignment</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your classes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === 'quiz' && <Code className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'assignment' && <FileText className="h-4 w-4 text-green-600" />}
                          {activity.type === 'note' && <BookOpen className="h-4 w-4 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.class} • {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Classes */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
                <Button asChild>
                  <Link href="/classes">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Class
                  </Link>
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : classes.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-500">
                      <h3 className="text-lg font-medium mb-2">No classes yet</h3>
                      <p className="mb-4">Create your first class to start teaching and sharing knowledge with students.</p>
                      <Button asChild>
                        <Link href="/classes">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Class
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classData) => (
                    <BasicClassCard 
                      key={classData.id} 
                      classData={classData}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats.totalNotes}</div>
                  <p className="text-sm text-gray-600 mb-4">Published notes</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/notes">View All</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Quizzes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats.totalQuizzes}</div>
                  <p className="text-sm text-gray-600 mb-4">Active quizzes</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/quizzes">View All</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Assignments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stats.totalAssignments}</div>
                  <p className="text-sm text-gray-600 mb-4">Active assignments</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/assignments">View All</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 