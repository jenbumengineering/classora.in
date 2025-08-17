'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Users, Mail, GraduationCap, BarChart3, Calendar, BookOpen, Code, FileText, Target } from 'lucide-react'
import Link from 'next/link'

interface StudentDetails {
  id: string
  name: string
  email: string
  enrolledClasses: number
  averageGrade: number
  lastActive: string
  classes: Array<{
    id: string
    name: string
    code: string
    enrolledAt: string
    _count: {
      notes: number
      quizzes: number
      assignments: number
    }
  }>
  quizAttempts: Array<{
    id: string
    quizTitle: string
    className: string
    score: number
    completedAt: string
  }>
  assignmentSubmissions: Array<{
    id: string
    assignmentTitle: string
    className: string
    grade: number | null
    submittedAt: string
  }>
}

export default function StudentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      loadStudentDetails()
    }
  }, [user, params.id])

  const loadStudentDetails = async () => {
    if (!user || !params.id) return

    try {
      const response = await fetch(`/api/dashboard/students/${params.id}`, {
        headers: {
          'x-user-id': user.id
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStudent(data)
      } else {
        console.error('Failed to load student details')
        router.push('/dashboard/students')
      }
    } catch (error) {
      console.error('Error loading student details:', error)
      router.push('/dashboard/students')
    } finally {
      setIsLoading(false)
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

  if (!student) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Not Found</h2>
            <p className="text-gray-600 mb-6">The student you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/students">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Students
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
              <Button asChild variant="outline" className="mb-4">
                <Link href="/dashboard/students">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Students
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                  <p className="text-gray-600">{student.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Stats */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Enrolled Classes</span>
                      <span className="font-medium">{student.enrolledClasses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Grade</span>
                      <span className="font-medium">{student.averageGrade}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="font-medium">{new Date(student.lastActive).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Enrolled Classes */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Enrolled Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {student.classes.map((cls) => (
                        <div key={cls.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="font-medium text-sm">{cls.name}</div>
                          <div className="text-xs text-gray-600 mb-2">{cls.code}</div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{cls._count.notes} notes</span>
                            <span>{cls._count.quizzes} quizzes</span>
                            <span>{cls._count.assignments} assignments</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quiz Attempts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Quiz Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {student.quizAttempts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No quiz attempts yet</p>
                    ) : (
                      <div className="space-y-3">
                        {student.quizAttempts.map((attempt) => (
                          <div key={attempt.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium text-sm">{attempt.quizTitle}</div>
                              <div className="text-xs text-gray-600">{attempt.className}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">{attempt.score}%</div>
                              <div className="text-xs text-gray-600">
                                {new Date(attempt.completedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assignment Submissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Assignment Submissions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {student.assignmentSubmissions.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No assignment submissions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {student.assignmentSubmissions.map((submission) => (
                          <div key={submission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium text-sm">{submission.assignmentTitle}</div>
                              <div className="text-xs text-gray-600">{submission.className}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                {submission.grade !== null ? `${submission.grade}%` : 'Not graded'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
