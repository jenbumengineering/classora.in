'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BookOpen, ArrowLeft, Plus, Target, FileText, Download, Play, BarChart3, Clock, CheckCircle, Code } from 'lucide-react'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

interface PracticeQuestion {
  id: string
  title: string
  content: string
  subject: string
  difficulty: string
  type: string
  points: number
  timeLimit?: number
  createdAt: string
  _count: {
    attempts: number
  }
}

interface PracticeFile {
  id: string
  title: string
  fileUrl: string
  uploadedAt: string
}

interface PracticeStats {
  totalAttempts: number
  averageScore: number
  timeSpent: number
  questionsAttempted: number
  totalQuestions: number
}

interface Quiz {
  id: string
  title: string
  description: string
  status: string
  noteId: string
  noteName: string
  questionCount: number
  timeLimit: number
}

export default function ClassPracticePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const classId = params.id as string
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classData, setClassData] = useState<Class | null>(null)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [files, setFiles] = useState<PracticeFile[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [stats, setStats] = useState<PracticeStats>({
    totalAttempts: 0,
    averageScore: 0,
    timeSpent: 0,
    questionsAttempted: 0,
    totalQuestions: 0
  })
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  useEffect(() => {
    if (user && classId) {
      loadClassData()
      loadQuestions()
      loadFiles()
      loadPracticeStats()
      loadQuizzes()
    }
  }, [user, classId])

  const loadClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`)
      if (response.ok) {
        const data = await response.json()
        setClassData(data)
      }
    } catch (error) {
      console.error('Error loading class data:', error)
    }
  }

  const loadQuestions = async () => {
    try {
      const response = await fetch(`/api/practice/questions?classId=${classId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        setQuestionCount(data.questions?.length || 0)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/practice/files?classId=${classId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const loadPracticeStats = async () => {
    try {
      const response = await fetch(`/api/practice/stats?classId=${classId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading practice stats:', error)
    }
  }

  const loadQuizzes = async () => {
    try {
      const response = await fetch(`/api/quizzes?classId=${classId}&status=PUBLISHED`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
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

  if (!classData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Not Found</h2>
            <p className="text-gray-600 mb-6">The class you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/practice">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Practice
              </Link>
            </Button>
          </div>
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
              <div className="flex items-center space-x-4 mb-6">
                <Button asChild variant="outline">
                  <Link href="/dashboard/practice/classes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Classes
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{classData.code} - {classData.name}</h1>
                <p className="text-gray-600 mt-2">Practice questions and materials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Practice Questions */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>Practice Questions</CardTitle>
                          <CardDescription>{questionCount} questions available</CardDescription>
                        </div>
                      </div>
                      {user?.role === 'PROFESSOR' && (
                        <Button asChild>
                          <Link href={`/dashboard/practice/classes/${classId}/questions/new`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Question
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {questions.length > 0 ? (
                      <div className="space-y-4">
                        {questions.map((question) => (
                          <div key={question.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{question.title}</h4>
                              <p className="text-sm text-gray-600">
                                {question.type} • {question.difficulty} • {question.points} points
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {question._count.attempts} attempts
                              </span>
                              <Button asChild size="sm">
                                <Link href={`/dashboard/practice/questions/${question.id}`}>
                                  <Play className="w-4 h-4 mr-1" />
                                  Practice
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No practice questions available</p>
                        <p className="text-sm text-gray-500">
                          {user?.role === 'PROFESSOR' 
                            ? 'Create your first practice question to get started.'
                            : 'Check back later for practice questions.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Practice Files */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>Practice Materials</CardTitle>
                          <CardDescription>Previous year questions and study materials</CardDescription>
                        </div>
                      </div>
                      {user?.role === 'PROFESSOR' && (
                        <Button asChild>
                          <Link href={`/dashboard/practice/classes/${classId}/files/new`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Upload File
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {files.length > 0 ? (
                      <div className="space-y-4">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <div>
                                <h4 className="font-medium text-gray-900">{file.title}</h4>
                                <p className="text-sm text-gray-600">
                                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <a href={file.fileUrl} download>
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No practice materials available</p>
                        <p className="text-sm text-gray-500">
                          {user?.role === 'PROFESSOR' 
                            ? 'Upload previous year questions and study materials.'
                            : 'Check back later for practice materials.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Practice Quizzes */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Code className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Practice Quizzes</CardTitle>
                        <CardDescription>Test your knowledge with quizzes from different topics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quizzes.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group quizzes by notes */}
                        {(() => {
                          const quizzesByNote = quizzes.reduce((acc, quiz) => {
                            const noteName = quiz.noteName || 'General';
                            if (!acc[noteName]) {
                              acc[noteName] = [];
                            }
                            acc[noteName].push(quiz);
                            return acc;
                          }, {} as Record<string, Quiz[]>);

                          return Object.entries(quizzesByNote).map(([noteName, noteQuizzes]) => (
                            <div key={noteName} className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-3">{noteName}</h4>
                              <div className="space-y-2">
                                {noteQuizzes.map((quiz) => (
                                  <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{quiz.title}</h5>
                                      <p className="text-sm text-gray-600">
                                        {quiz.questionCount} questions • {quiz.timeLimit} minutes
                                      </p>
                                    </div>
                                    <Button asChild size="sm">
                                      <Link href={`/dashboard/quizzes/${quiz.id}/take`}>
                                        <Play className="w-4 h-4 mr-1" />
                                        Take Quiz
                                      </Link>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No quizzes available</p>
                        <p className="text-sm text-gray-500">
                          Check back later for quizzes from your professor.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Practice Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600 mb-1">
                          {stats.totalAttempts}
                        </div>
                        <div className="text-xs text-gray-600">Total Attempts</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600 mb-1">
                          {stats.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Avg Score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-xl font-bold text-yellow-600 mb-1">
                          {Math.round(stats.timeSpent / 60)}m
                        </div>
                        <div className="text-xs text-gray-600">Time Spent</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600 mb-1">
                          {stats.questionsAttempted}/{stats.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-600">Questions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      asChild 
                      className="w-full justify-start"
                      disabled={questionCount === 0}
                    >
                      <Link href={`/dashboard/practice/classes/${classId}/start`}>
                        <Play className="w-4 h-4 mr-2" />
                        Start Practice Session
                      </Link>
                    </Button>
                    {user?.role === 'PROFESSOR' && (
                      <>
                        <Button asChild variant="outline" className="w-full justify-start">
                          <Link href={`/dashboard/practice/classes/${classId}/questions/new`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Question
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                          <Link href={`/dashboard/practice/classes/${classId}/files/new`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Upload Material
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
