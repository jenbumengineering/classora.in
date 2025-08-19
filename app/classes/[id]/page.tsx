'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  GraduationCap, 
  MapPin, 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Check,
  Play,
  Download,
  Award,
  Clock,
  User
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import toast from 'react-hot-toast'

interface Note {
  id: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED' | 'PRIVATE'
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    code: string
  }
  professor: {
    id: string
    name: string
    email: string
  }
}

interface Quiz {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  timeLimit?: number
  totalQuestions: number
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    code: string
  }
  professor: {
    id: string
    name: string
    email: string
  }
}

interface Assignment {
  id: string
  title: string
  description: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  dueDate?: string
  category?: string
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    code: string
  }
  professor: {
    id: string
    name: string
    email: string
  }
}

interface ClassData {
  id: string
  name: string
  code: string
  description?: string
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

type TabType = 'overview' | 'curriculum' | 'instructor'

export default function ClassPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const classId = params.id as string

  useEffect(() => {
    if (classId) {
      loadClassData()
      loadClassContent()
      if (user?.role === 'STUDENT') {
        checkEnrollment()
      }
    }
  }, [classId, user])

  const loadClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Class not found')
          router.push('/classes')
          return
        }
        throw new Error('Failed to load class data')
      }
      const data = await response.json()
      setClassData(data)
    } catch (error) {
      console.error('Error loading class:', error)
      toast.error('Failed to load class data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadClassContent = async () => {
    try {
      // Load notes
      const notesResponse = await fetch(`/api/notes?classId=${classId}&status=PUBLISHED`)
      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        setNotes(notesData.notes || [])
      }

      // Load quizzes
      const quizzesResponse = await fetch(`/api/quizzes?classId=${classId}&status=PUBLISHED`)
      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json()
        setQuizzes(quizzesData.quizzes || [])
      }

      // Load assignments
      const assignmentsResponse = await fetch(`/api/assignments?classId=${classId}&status=PUBLISHED`)
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData.assignments || [])
      }
    } catch (error) {
      console.error('Error loading class content:', error)
    }
  }

  const checkEnrollment = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/enrollments?studentId=${user.id}&classId=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setIsEnrolled(data.enrollments.some((e: any) => e.classId === classId))
      }
    } catch (error) {
      console.error('Error checking enrollment:', error)
    }
  }

  const handleEnroll = async () => {
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

      setIsEnrolled(true)
      toast.success('Successfully enrolled in class!')
    } catch (error) {
      console.error('Error enrolling:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to enroll')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex justify-center items-center h-screen">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Class not found</h1>
            <Button onClick={() => router.push('/classes')}>
              Back to Classes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'instructor', label: 'Instructor' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            {/* Class Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{classData.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">Class Code: {classData.code}</p>
                </div>
                {user?.role === 'PROFESSOR' && user?.id === classData.professor.id && (
                  <Button asChild>
                    <Link href={`/classes/${classId}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Class
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Enrollment Button */}
            {user?.role === 'STUDENT' && !isEnrolled && (
              <div className="mb-6">
                <Button 
                  onClick={handleEnroll}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
                >
                  Enroll in Class
                </Button>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* About This Course */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Course</h2>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        <RichTextRenderer content={classData.description || 'No description available for this course.'} />
                      </div>
                    </div>

                    {/* What You'll Learn */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You'll Learn</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Master fundamental concepts and principles</span>
                          </div>
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Apply knowledge through practical exercises</span>
                          </div>
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Develop critical thinking and problem-solving skills</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Understand advanced topics and methodologies</span>
                          </div>
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Build real-world projects and applications</span>
                          </div>
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Prepare for professional development</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h2>
                      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Basic understanding of the subject matter</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Access to required learning materials</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Commitment to complete assignments and assessments</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'curriculum' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Class Curriculum</h2>
                    <div className="space-y-6">
                      {/* Notes Section */}
                      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-gray-900 dark:text-white">Notes</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            {quizzes.length} quizzes • {assignments.length} assignments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {notes.length > 0 ? (
                            <div className="space-y-3">
                              {notes.map((note) => (
                                <div key={note.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-center">
                                    <BookOpen className="w-5 h-5 text-orange-500 mr-3" />
                                    <span className="text-gray-900 dark:text-gray-300">{note.title}</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                                      {formatDate(note.createdAt)}
                                    </span>
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/dashboard/notes/${note.id}`}>
                                        View
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                              <BookOpen className="h-8 w-8 mx-auto mb-2" />
                              <p>No notes available yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Quizzes Section */}
                      {quizzes.length > 0 && (
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Quizzes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {quizzes.map((quiz) => (
                                <div key={quiz.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-center">
                                    <FileText className="w-5 h-5 text-orange-500 mr-3" />
                                    <span className="text-gray-900 dark:text-gray-300">{quiz.title}</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">{quiz.totalQuestions} questions</span>
                                    {quiz.timeLimit && (
                                      <span className="text-gray-500 dark:text-gray-400 text-sm">{quiz.timeLimit} min</span>
                                    )}
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/dashboard/quizzes/${quiz.id}`}>
                                        View
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Assignments Section */}
                      {assignments.length > 0 && (
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Assignments</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {assignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-center">
                                    <Calendar className="w-5 h-5 text-orange-500 mr-3" />
                                    <span className="text-gray-900 dark:text-gray-300">{assignment.title}</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    {assignment.dueDate && (
                                      <span className="text-gray-500 dark:text-gray-400 text-sm">Due {formatDate(assignment.dueDate)}</span>
                                    )}
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/dashboard/assignments/${assignment.id}`}>
                                        View
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {quizzes.length === 0 && assignments.length === 0 && notes.length === 0 && (
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <CardContent className="text-center py-8">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400">No content available yet</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'instructor' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Instructor</h2>
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-6">
                          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                            <User className="w-10 h-10 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{classData.professor.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">{classData.professor.email}</p>
                            {classData.professor.teacherProfile?.university && (
                              <p className="text-gray-700 dark:text-gray-300 mb-2">
                                <strong>University:</strong> {classData.professor.teacherProfile.university}
                              </p>
                            )}
                            {classData.professor.teacherProfile?.department && (
                              <p className="text-gray-700 dark:text-gray-300 mb-4">
                                <strong>Department:</strong> {classData.professor.teacherProfile.department}
                              </p>
                            )}
                            <p className="text-gray-700 dark:text-gray-300">
                              Experienced educator with expertise in {classData.name} and related subjects. 
                              Committed to providing quality education and fostering student success through 
                              engaging learning experiences and practical applications.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">This Course Includes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Play className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{notes.length} video lessons</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{quizzes.length} quizzes</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{assignments.length} assignments</span>
                      </div>
                      <div className="flex items-center">
                        <Download className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">Downloadable resources</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">Certificate of completion</span>
                      </div>
                    </div>

                    {/* Class Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{classData._count.enrollments}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{quizzes.length + assignments.length + notes.length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
                        </div>
                      </div>
                    </div>
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
