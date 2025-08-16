'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import { ArrowLeft, BookOpen, FileText, Calendar, Clock, User, Edit, Eye, Target } from 'lucide-react'
import Link from 'next/link'
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
  description?: string
  dueDate?: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classId: string
  className?: string
  questionCount?: number
  timeLimit?: number
  isActive?: boolean
  createdAt?: string
}

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classId: string
  className?: string
  createdAt?: string
  updatedAt?: string
}

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [note, setNote] = useState<Note | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(true)

  const noteId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadNote()
  }, [user, router, noteId])

  const loadNote = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`)
      
      if (response.ok) {
        const noteData = await response.json()
        
        // Check if user can view this note
        if (user?.role === 'STUDENT' && noteData.status !== 'PUBLISHED') {
          toast.error('This note is not available for viewing')
          router.push('/dashboard/notes')
          return
        }
        
        if (user?.role === 'PROFESSOR' && noteData.professor.id !== user.id) {
          toast.error('You can only view your own notes')
          router.push('/dashboard/notes')
          return
        }

        setNote(noteData)
        loadRelatedContent(noteData.class.id)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load note')
      }
    } catch (error) {
      console.error('Error loading note:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load note')
      router.push('/dashboard/notes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRelatedContent = async (classId: string) => {
    try {
      setIsLoadingRelated(true)
      
      // Load quizzes for this class
      const quizzesResponse = await fetch(`/api/quizzes?classId=${classId}&status=PUBLISHED`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json()
        setQuizzes(quizzesData.quizzes || [])
      }

      // Load assignments for this class
      const assignmentsResponse = await fetch(`/api/assignments?classId=${classId}&status=PUBLISHED`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData.assignments || [])
      }
    } catch (error) {
      console.error('Error loading related content:', error)
    } finally {
      setIsLoadingRelated(false)
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

  if (!note) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Note Not Found</h2>
            <p className="text-gray-600 mb-6">The note you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/notes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Notes
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
              <div className="flex items-center justify-between mb-6">
                <Button asChild variant="outline">
                  <Link href="/dashboard/notes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Notes
                  </Link>
                </Button>
                {user?.role === 'PROFESSOR' && note.professor.id === user.id && (
                  <Button asChild>
                    <Link href={`/dashboard/notes/${note.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Note
                    </Link>
                  </Button>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{note.class.code} - {note.class.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{note.professor.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Note Content</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <RichTextRenderer content={note.content} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Note Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        note.status === 'PUBLISHED' 
                          ? 'bg-green-500' 
                          : note.status === 'DRAFT'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium capitalize">{note.status.toLowerCase()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Quizzes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Related Quizzes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRelated ? (
                      <LoadingSpinner size="sm" />
                    ) : quizzes.length > 0 ? (
                      <div className="space-y-3">
                        {quizzes.map((quiz) => (
                          <div key={quiz.id} className="p-3 border border-gray-200 rounded-md">
                            <h4 className="font-medium text-gray-900 mb-1">{quiz.title}</h4>
                            {quiz.description && (
                              <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              {quiz.timeLimit && (
                                <span>{quiz.timeLimit} min</span>
                              )}
                              {quiz.questionCount && (
                                <span>{quiz.questionCount} questions</span>
                              )}
                              {quiz.createdAt && (
                                <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                asChild 
                                size="sm" 
                                variant="outline"
                              >
                                <Link href={`/dashboard/quizzes/${quiz.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Quiz
                                </Link>
                              </Button>
                              {user?.role === 'STUDENT' && quiz.status === 'PUBLISHED' && (
                                <Button 
                                  asChild 
                                  size="sm" 
                                >
                                  <Link href={`/dashboard/quizzes/${quiz.id}/take`}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Attempt Quiz
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No quizzes available for this class.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Related Assignments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Related Assignments</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRelated ? (
                      <LoadingSpinner size="sm" />
                    ) : assignments.length > 0 ? (
                      <div className="space-y-3">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="p-3 border border-gray-200 rounded-md">
                            <h4 className="font-medium text-gray-900 mb-1">{assignment.title}</h4>
                            {assignment.description && (
                              <div className="text-gray-600 mb-2">
                                <div 
                                  className="prose max-w-none line-clamp-3"
                                  dangerouslySetInnerHTML={{ __html: assignment.description }}
                                />
                              </div>
                            )}
                            {assignment.dueDate && (
                              <p className="text-xs text-gray-500 mb-2">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                asChild 
                                size="sm" 
                                variant="outline"
                              >
                                <Link href={`/dashboard/assignments/${assignment.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Assignment
                                </Link>
                              </Button>
                              {user?.role === 'STUDENT' && assignment.status === 'PUBLISHED' && (
                                <Button 
                                  asChild 
                                  size="sm" 
                                >
                                  <Link href={`/dashboard/assignments/${assignment.id}`}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Submit Assignment
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No assignments available for this class.</p>
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
