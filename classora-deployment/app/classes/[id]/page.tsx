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
  Eye
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

function ClassNotes({ classId, userRole }: { classId: string; userRole?: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadNotes()
  }, [classId])

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams({
        classId,
        status: userRole === 'PROFESSOR' ? '' : 'PUBLISHED'
      })

      const response = await fetch(`/api/notes?${params}`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        toast.success('Note deleted successfully!')
        loadNotes() // Reload the notes list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete note')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No notes available yet</p>
        {userRole === 'PROFESSOR' && (
          <p className="text-sm mt-2">Create your first note to share with students</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">{note.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              note.status === 'PUBLISHED' 
                ? 'bg-green-100 text-green-800' 
                : note.status === 'DRAFT' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {note.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 line-clamp-2 mb-3">
            <RichTextRenderer content={note.content} />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Created {formatDate(note.createdAt)}</span>
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/notes/${note.id}`}>
                  View
                </Link>
              </Button>
              {userRole === 'PROFESSOR' && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/notes/${note.id}/edit`}>
                      <Edit className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClassQuizzes({ classId, userRole, quizzes: initialQuizzes }: { classId: string; userRole?: string; quizzes?: Quiz[] }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes || [])
  const [isLoading, setIsLoading] = useState(!initialQuizzes)
  const { user } = useAuth()

  useEffect(() => {
    if (initialQuizzes) {
      setQuizzes(initialQuizzes)
      setIsLoading(false)
    } else {
      loadQuizzes()
    }
  }, [classId, user, initialQuizzes])

  const loadQuizzes = async () => {
    try {
      let response: Response

      if (user?.id) {
        // User is authenticated - use secure endpoint
        const params = new URLSearchParams({
          classId
        })
        
        // Only add status parameter if not professor (students see only published)
        if (userRole !== 'PROFESSOR') {
          params.append('status', 'PUBLISHED')
        }

        response = await fetch(`/api/quizzes?${params}`, {
          headers: {
            'x-user-id': user.id
          }
        })
      } else {
        // User is not authenticated - use public endpoint
        response = await fetch(`/api/classes/${classId}/quizzes`)
      }
      
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      } else {
        console.error('Failed to load quizzes:', response.status)
        setQuizzes([])
      }
    } catch (error) {
      console.error('Error loading quizzes:', error)
      setQuizzes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        toast.success('Quiz deleted successfully!')
        loadQuizzes() // Reload the quizzes list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete quiz')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No quizzes available yet</p>
        {userRole === 'PROFESSOR' && (
          <p className="text-sm mt-2">Create your first quiz to test your students</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <div key={quiz.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">{quiz.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              quiz.status === 'PUBLISHED' 
                ? 'bg-green-100 text-green-800' 
                : quiz.status === 'DRAFT' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {quiz.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 line-clamp-2 mb-3">
            {quiz.description}
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex space-x-4">
              <span>{quiz.totalQuestions} questions</span>
              {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
            </div>
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/quizzes/${quiz.id}`}>
                  View
                </Link>
              </Button>
              {userRole === 'PROFESSOR' && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                      <Edit className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClassAssignments({ classId, userRole, assignments: initialAssignments }: { classId: string; userRole?: string; assignments?: Assignment[] }) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments || [])
  const [isLoading, setIsLoading] = useState(!initialAssignments)
  const { user } = useAuth()

  useEffect(() => {
    if (initialAssignments) {
      setAssignments(initialAssignments)
      setIsLoading(false)
    } else {
      loadAssignments()
    }
  }, [classId, user, initialAssignments])

  const loadAssignments = async () => {
    try {
      let response: Response

      if (user?.id) {
        // User is authenticated - use secure endpoint
        const params = new URLSearchParams({
          classId
        })
        
        // Only add status parameter if not professor (students see only published)
        if (userRole !== 'PROFESSOR') {
          params.append('status', 'PUBLISHED')
        }

        response = await fetch(`/api/assignments?${params}`, {
          headers: {
            'x-user-id': user.id
          }
        })
      } else {
        // User is not authenticated - use public endpoint
        response = await fetch(`/api/classes/${classId}/assignments`)
      }
      
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        console.error('Failed to load assignments:', response.status)
        setAssignments([])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      setAssignments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        toast.success('Assignment deleted successfully!')
        loadAssignments() // Reload the assignments list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete assignment')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No assignments available yet</p>
        {userRole === 'PROFESSOR' && (
          <p className="text-sm mt-2">Create your first assignment for your students</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">{assignment.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              assignment.status === 'PUBLISHED' 
                ? 'bg-green-100 text-green-800' 
                : assignment.status === 'DRAFT' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {assignment.status}
            </span>
          </div>
          <div className="text-gray-600 line-clamp-2 mb-3">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: assignment.description || '<p>No description provided.</p>' }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex space-x-4">
              {assignment.category && <span>{assignment.category}</span>}
              {assignment.dueDate && <span>Due {formatDate(assignment.dueDate)}</span>}
            </div>
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/assignments/${assignment.id}`}>
                  View
                </Link>
              </Button>
              {userRole === 'PROFESSOR' && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                      <Edit className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
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

export default function ClassPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  const classId = params.id as string
  


  useEffect(() => {
    if (classId) {
      loadClassData()
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
              <Link href="/classes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isProfessor = user?.role === 'PROFESSOR' && user?.id === classData.professor.id

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
                  <Link href="/classes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Classes
                  </Link>
                </Button>
                {user?.role === 'STUDENT' && !isEnrolled && (
                  <Button onClick={handleEnroll}>
                    Enroll in Class
                  </Button>
                )}
                {isProfessor && (
                  <Button asChild>
                    <Link href={`/classes/${classId}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Class
                    </Link>
                  </Button>
                )}
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
                  <p className="text-xl text-gray-600 mt-2">{classData.code}</p>
                  {classData.description && (
                    <p className="text-gray-700 mt-4 max-w-3xl">{classData.description}</p>
                  )}
                </div>
                {isEnrolled && (
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Enrolled
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Professor Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5" />
                      <span>Professor</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{classData.professor.name}</h3>
                        <p className="text-gray-600">{classData.professor.email}</p>
                        {classData.professor.teacherProfile?.university && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{classData.professor.teacherProfile.university}</span>
                            {classData.professor.teacherProfile.department && (
                              <span>• {classData.professor.teacherProfile.department}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button asChild variant="outline">
                        <Link href={`/teachers/${classData.professor.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Class Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Class Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{classData._count.enrollments}</div>
                        <div className="text-sm text-gray-600">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                          <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{classData._count.notes}</div>
                        <div className="text-sm text-gray-600">Notes</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{classData._count.quizzes}</div>
                        <div className="text-sm text-gray-600">Quizzes</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                          <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{classData._count.assignments}</div>
                        <div className="text-sm text-gray-600">Assignments</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card id="notes-section">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Notes</span>
                      </div>
                      {user?.role === 'PROFESSOR' && (
                        <Button asChild size="sm">
                          <Link href={`/dashboard/notes/new?classId=${classId}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                          </Link>
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClassNotes classId={classId} userRole={user?.role} />
                  </CardContent>
                </Card>

                {/* Quizzes Section */}
                <Card id="quizzes-section">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Quizzes</span>
                      </div>
                      {user?.role === 'PROFESSOR' && (
                        <Button asChild size="sm">
                          <Link href={`/dashboard/quizzes/new?classId=${classId}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quiz
                          </Link>
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClassQuizzes classId={classId} userRole={user?.role} />
                  </CardContent>
                </Card>

                {/* Assignments Section */}
                <Card id="assignments-section">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Assignments</span>
                      </div>
                      {user?.role === 'PROFESSOR' && (
                        <Button asChild size="sm">
                          <Link href={`/dashboard/assignments/new?classId=${classId}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Assignment
                          </Link>
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClassAssignments classId={classId} userRole={user?.role} />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user?.role === 'PROFESSOR' ? (
                      <>
                        <Button asChild className="w-full justify-start">
                          <Link href={`/dashboard/notes/new?classId=${classId}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                          <Link href={`/dashboard/quizzes/new?classId=${classId}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quiz
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                          <Link href={`/dashboard/assignments/new?classId=${classId}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Assignment
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          className="w-full justify-start"
                          onClick={() => scrollToSection('notes-section')}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          View Notes
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => scrollToSection('quizzes-section')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Take Quizzes
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => scrollToSection('assignments-section')}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View Assignments
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Class Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Class Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm font-medium">{formatDate(classData.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Class Code</p>
                      <p className="text-sm font-medium font-mono">{classData.code}</p>
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
