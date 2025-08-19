'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BookOpen, Play, BarChart3, Clock, Users, Target, Zap, Plus, FileText, Code, Search, Filter, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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
  const [filteredQuestions, setFilteredQuestions] = useState<PracticeQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedClass, setSelectedClass] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
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
        loadClasses()
      ])
    } catch (error) {
      console.error('Error loading student practice data:', error)
    } finally {
      setIsLoading(false)
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return <Code className="w-4 h-4" />
      case 'MULTIPLE_SELECTION':
        return <Code className="w-4 h-4" />
      case 'TRUE_FALSE':
        return <Code className="w-4 h-4" />
      case 'SHORT_ANSWER':
        return <FileText className="w-4 h-4" />
      default:
        return <Code className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'text-green-600 bg-green-100'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100'
      case 'HARD':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
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

  // Teacher Practice Page
  if (user?.role === 'PROFESSOR') {
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Practice Management</h1>
                    <p className="text-gray-600 mt-2">Create and manage practice questions for your students</p>
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/practice/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Question
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                    <p className="text-xs text-muted-foreground">
                      Practice questions created
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedQuestions}</div>
                    <p className="text-xs text-muted-foreground">
                      Student attempts
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.averageScore}%</div>
                    <p className="text-xs text-muted-foreground">
                      Across all attempts
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.timeSpent}m</div>
                    <p className="text-xs text-muted-foreground">
                      Time spent by students
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="All">All Types</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="MULTIPLE_SELECTION">Multiple Selection</option>
                      <option value="TRUE_FALSE">True/False</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="All">All Classes</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="All">All Difficulties</option>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Practice Questions ({filteredQuestions.length})
                  </h2>
                </div>

                {filteredQuestions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                      <p className="text-gray-600 text-center mb-4">
                        {searchTerm || selectedType !== 'All' || selectedClass !== 'All' || selectedDifficulty !== 'All'
                          ? 'Try adjusting your search or filters'
                          : 'Create your first practice question to get started'
                        }
                      </p>
                      {!searchTerm && selectedType === 'All' && selectedClass === 'All' && selectedDifficulty === 'All' && (
                        <Button asChild>
                          <Link href="/dashboard/practice/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Question
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredQuestions.map((question) => (
                      <Card key={question.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getTypeIcon(question.type)}
                                <span className="text-sm text-gray-500 capitalize">
                                  {question.type.replace('_', ' ').toLowerCase()}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {question.points} points
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.title}</h3>
                              <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{question.class}</span>
                                <span>{question._count.attempts} attempts</span>
                                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/practice/questions/${question.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/practice/questions/${question.id}/stats`}>
                                  Stats
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Student Practice Page (existing code)
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Practice Center</h1>
                <p className="text-gray-600 mt-2">Sharpen your skills with practice questions and assessments</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                  <p className="text-xs text-muted-foreground">
                    Available practice questions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedQuestions}</div>
                  <p className="text-xs text-muted-foreground">
                    Questions attempted
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                  <p className="text-xs text-muted-foreground">
                    Your performance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {stats.recentActivity.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        {activity.score && (
                          <div className="text-sm font-medium text-green-600">
                            {activity.score}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Classes */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Practice by Class</h2>
              </div>
              
              {classes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No classes available</h3>
                    <p className="text-gray-600 text-center">
                      You need to be enrolled in classes to access practice questions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((cls) => (
                    <Card key={cls.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">{cls.name}</span>
                          <span className="text-sm font-normal text-gray-500">{cls.code}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {cls.description || 'No description available'}
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
              )}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Link href="/dashboard/practice/questions">
                      <Code className="h-6 w-6" />
                      <span>Browse All Questions</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Link href="/dashboard/practice/classes">
                      <BookOpen className="h-6 w-6" />
                      <span>View by Class</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Link href="/dashboard/practice/stats">
                      <BarChart3 className="h-6 w-6" />
                      <span>View Statistics</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
