'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
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
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening with your classes today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Classes</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalClasses}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active classes</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalStudents}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Enrolled students</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.averageScore}%</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Across all quizzes</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Reviews</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.pendingSubmissions}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Need grading</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Common tasks you can perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-24 p-4 flex flex-col items-center justify-center space-y-3 bg-orange-500 hover:bg-orange-600 text-white">
                <Link href="/classes" className="w-full h-full flex flex-col items-center justify-center">
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">Create Class</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 p-4 flex flex-col items-center justify-center space-y-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Link href="/dashboard/notes/new" className="w-full h-full flex flex-col items-center justify-center">
                  <BookOpen className="h-8 w-8" />
                  <span className="text-sm font-medium">Add Note</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 p-4 flex flex-col items-center justify-center space-y-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Link href="/dashboard/quizzes/new" className="w-full h-full flex flex-col items-center justify-center">
                  <Code className="h-8 w-8" />
                  <span className="text-sm font-medium">Create Quiz</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 p-4 flex flex-col items-center justify-center space-y-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Link href="/dashboard/assignments/new" className="w-full h-full flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8" />
                  <span className="text-sm font-medium">Add Assignment</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Latest updates from your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'quiz' && <Code className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'assignment' && <FileText className="h-4 w-4 text-green-500" />}
                    {activity.type === 'note' && <BookOpen className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Classes</h2>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-6">
            <Link href="/classes" className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Class
            </Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <h3 className="text-lg font-medium mb-2">No classes yet</h3>
                <p className="mb-4">Create your first class to start teaching and sharing knowledge with students.</p>
                <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-6">
                  <Link href="/classes" className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Class
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
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <BookOpen className="h-5 w-5 text-orange-500" />
              <span>Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{stats.totalNotes}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Published notes</p>
            <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Link href="/dashboard/notes">View All</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Code className="h-5 w-5 text-purple-500" />
              <span>Quizzes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{stats.totalQuizzes}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Active quizzes</p>
            <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Link href="/dashboard/quizzes">View All</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <FileText className="h-5 w-5 text-green-500" />
              <span>Assignments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{stats.totalAssignments}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Active assignments</p>
            <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Link href="/dashboard/assignments">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 