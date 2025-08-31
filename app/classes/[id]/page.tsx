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
  User,
  ChevronDown,
  ChevronUp,
  Code,
  List,
  Mail,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import toast from 'react-hot-toast'
import { Avatar } from '@/lib/avatar'

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
  noteId?: string
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
  noteId?: string
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
    bio?: string
    avatar?: string
    teacherProfile?: {
      university?: string
      college?: string
      department?: string
      address?: string
      phone?: string
      website?: string
      linkedin?: string
      researchInterests?: string
      qualifications?: string
      experience?: string
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
  const [enrollmentLoading, setEnrollmentLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  
  // Invite functionality state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteType, setInviteType] = useState<'email' | 'existing'>('email')
  const [emailInvites, setEmailInvites] = useState<string[]>([''])
  const [existingStudents, setExistingStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isSendingInvites, setIsSendingInvites] = useState(false)

  const classId = params.id as string

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (classId) {
      loadClassData()
    }
  }, [classId])

  useEffect(() => {
    if (classId && !enrollmentLoading) {
      loadClassContent()
    }
  }, [classId, enrollmentLoading, isEnrolled])

  useEffect(() => {
    if (classId && user?.id && user?.role === 'STUDENT') {
      setEnrollmentLoading(true) // Reset loading state
      checkEnrollment()
    } else if (classId && user?.role !== 'STUDENT') {
      // If user is not a student, set enrollment loading to false
      setEnrollmentLoading(false)
    }
  }, [classId, user?.id, user?.role])

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
    // Only load content if user is enrolled or is the professor
    if (user?.role === 'STUDENT' && !isEnrolled) {
      return
    }

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
    if (!user) {
      setEnrollmentLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/enrollments?studentId=${user.id}&classId=${classId}`, {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        const isEnrolledInThisClass = data.enrollments.some((e: any) => e.classId === classId)
        setIsEnrolled(isEnrolledInThisClass)
      } else {
        console.error('Failed to check enrollment status')
        setIsEnrolled(false)
      }
    } catch (error) {
      console.error('Error checking enrollment:', error)
      setIsEnrolled(false)
    } finally {
      setEnrollmentLoading(false)
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

  const loadExistingStudents = async () => {
    if (!user || user.role !== 'PROFESSOR') return

    setIsLoadingStudents(true)
    try {
      const response = await fetch(`/api/classes/${classId}/available-students`, {
        headers: {
          'x-user-id': user.id
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExistingStudents(data.students || [])
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error('Failed to load students')
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load available students')
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const handleAddEmailField = () => {
    setEmailInvites([...emailInvites, ''])
  }

  const handleRemoveEmailField = (index: number) => {
    if (emailInvites.length > 1) {
      setEmailInvites(emailInvites.filter((_, i) => i !== index))
    }
  }

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emailInvites]
    newEmails[index] = value
    setEmailInvites(newEmails)
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSendInvites = async () => {
    if (!user || user.role !== 'PROFESSOR') return

    setIsSendingInvites(true)
    try {
      let response
      
      if (inviteType === 'email') {
        const validEmails = emailInvites.filter(email => email.trim() !== '')
        if (validEmails.length === 0) {
          toast.error('Please enter at least one email address')
          return
        }

        response = await fetch(`/api/classes/${classId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({
            emails: validEmails
          })
        })
      } else {
        if (selectedStudents.length === 0) {
          toast.error('Please select at least one student')
          return
        }

        response = await fetch(`/api/classes/${classId}/invite-existing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({
            studentIds: selectedStudents
          })
        })
      }

      if (response.ok) {
        toast.success('Invites sent successfully!')
        setShowInviteModal(false)
        setEmailInvites([''])
        setSelectedStudents([])
        setInviteType('email')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invites')
      }
    } catch (error) {
      console.error('Error sending invites:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invites')
    } finally {
      setIsSendingInvites(false)
    }
  }

  const openInviteModal = () => {
    setShowInviteModal(true)
  }

  // Load existing students when modal opens and existing tab is selected
  useEffect(() => {
    if (showInviteModal && inviteType === 'existing') {
      loadExistingStudents()
    }
  }, [showInviteModal, inviteType])

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
                  <div className="flex space-x-3">
                    <Button onClick={openInviteModal}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Students
                    </Button>
                    <Button asChild>
                      <Link href={`/classes/${classId}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Class
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Enrollment Button */}
            {user?.role === 'STUDENT' && !enrollmentLoading && !isEnrolled && (
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

            {/* Enrollment Gate for Students */}
            {user?.role === 'STUDENT' && !enrollmentLoading && !isEnrolled && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-8 text-center mb-8">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Enroll to Access Course Content
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You need to enroll in this class to view notes, quizzes, assignments, and other course materials.
                  </p>
                  <Button 
                    onClick={handleEnroll}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
                  >
                    Enroll in Class
                  </Button>
                </div>
              </div>
            )}

            {/* Tab Content - Only show if enrolled or professor */}
            {(user?.role !== 'STUDENT' || isEnrolled) && (
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
                          {classData._count.notes > 0 && (
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">Access {classData._count.notes} comprehensive learning materials and notes</span>
                          </div>
                          )}
                          {classData._count.quizzes > 0 && (
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">Test your knowledge with {classData._count.quizzes} interactive quizzes</span>
                          </div>
                          )}
                          {classData._count.assignments > 0 && (
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">Complete {classData._count.assignments} practical assignments</span>
                          </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Learn from an experienced instructor in {classData.name}</span>
                          </div>
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Join a community of {classData._count.enrollments} students</span>
                          </div>
                          <div className="flex items-start">
                            <Check className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Track your progress and achievements</span>
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
                          <span>Enrollment in this class to access all materials</span>
                        </li>
                        {classData._count.quizzes > 0 && (
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>Commitment to complete {classData._count.quizzes} quizzes for assessment</span>
                          </li>
                        )}
                        {classData._count.assignments > 0 && (
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span>Dedication to finish {classData._count.assignments} assignments</span>
                        </li>
                        )}
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>Regular participation in class activities</span>
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
                            {classData._count.quizzes} quizzes • {classData._count.assignments} assignments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {notes.length > 0 ? (
                            <div className="space-y-3">
                                                            {notes.map((note) => {
                                const noteQuizzes = quizzes.filter(quiz => quiz.noteId === note.id)
                                const noteAssignments = assignments.filter(assignment => assignment.noteId === note.id)
                                const isExpanded = expandedNotes.has(note.id)
                                

                                
                                return (
                                  <div key={note.id} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                    {/* Note Header - Always Visible */}
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4">
                                  <div className="flex items-center">
                                    <BookOpen className="w-5 h-5 text-orange-500 mr-3" />
                                        <span className="text-gray-900 dark:text-gray-300 font-medium">{note.title}</span>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                                      {formatDate(note.createdAt)}
                                    </span>
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={`/dashboard/notes/${note.id}`}>
                                            View Note
                                          </Link>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleNoteExpansion(note.id)}
                                          className="p-1"
                                        >
                                          {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-500" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                                        {/* Quizzes Section */}
                                        {noteQuizzes.length > 0 && (
                                          <div className="mb-6">
                                            <div className="flex items-center mb-3">
                                              <Code className="w-4 h-4 text-orange-500 mr-2" />
                                              <h4 className="text-md font-medium text-gray-900 dark:text-white">Quizzes</h4>
                                            </div>
                                            <div className="space-y-2">
                                              {noteQuizzes.map((quiz) => (
                                                <div key={quiz.id} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:shadow-md transition-shadow">
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                                      {quiz.title}
                                                    </h5>
                                                    <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400 space-x-3">
                                                      <span>{quiz.totalQuestions} Questions</span>
                                                      {quiz.timeLimit && (
                                                        <span>{quiz.timeLimit} min</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <Button asChild variant="outline" size="sm" className="ml-3 flex-shrink-0">
                                                    <Link href={`/dashboard/quizzes/${quiz.id}`}>
                                                      View
                                                    </Link>
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Assignments Section */}
                                        {noteAssignments.length > 0 && (
                                          <div>
                                            <div className="flex items-center mb-3">
                                              <List className="w-4 h-4 text-orange-500 mr-2" />
                                              <h4 className="text-md font-medium text-gray-900 dark:text-white">Assignments</h4>
                                            </div>
                                            <div className="space-y-2">
                                              {noteAssignments.map((assignment) => (
                                                <div key={assignment.id} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:shadow-md transition-shadow">
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                                      {assignment.title}
                                                    </h5>
                                                    <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                      {assignment.dueDate && (
                                                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <Button asChild variant="outline" size="sm" className="ml-3 flex-shrink-0">
                                                    <Link href={`/dashboard/assignments/${assignment.id}`}>
                                                      View
                                                    </Link>
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Empty State if no quizzes or assignments */}
                                        {noteQuizzes.length === 0 && noteAssignments.length === 0 && (
                                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                            <p>No quizzes or assignments linked to this note</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                              <BookOpen className="h-8 w-8 mx-auto mb-2" />
                              <p>No notes available yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* General Assignments Section (for assignments not linked to notes) */}
                      {assignments.filter(assignment => !assignment.noteId).length > 0 && (
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">General Assignments</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                              Assignments not linked to specific notes
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {assignments.filter(assignment => !assignment.noteId).map((assignment) => (
                                <div key={assignment.id} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:shadow-md transition-shadow">
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                      {assignment.title}
                                    </h5>
                                    <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
                                      {assignment.dueDate && (
                                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                  <Button asChild variant="outline" size="sm" className="ml-3 flex-shrink-0">
                                    <Link href={`/dashboard/assignments/${assignment.id}`}>
                                      View
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}



                      {notes.length === 0 && (
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
                          <Avatar 
                            src={classData.professor.avatar} 
                            alt={classData.professor.name} 
                            size="xl"
                            className="w-20 h-20"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{classData.professor.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">{classData.professor.email}</p>
                            
                            {/* Professional Information */}
                            {(classData.professor.teacherProfile?.university || classData.professor.teacherProfile?.college) && (
                              <div className="mb-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <strong>Institution:</strong> {classData.professor.teacherProfile?.university || classData.professor.teacherProfile?.college}
                                </p>
                                {classData.professor.teacherProfile?.department && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <strong>Department:</strong> {classData.professor.teacherProfile.department}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Contact Information */}
                            {(classData.professor.teacherProfile?.phone || classData.professor.teacherProfile?.website || classData.professor.teacherProfile?.linkedin) && (
                              <div className="mb-4">
                                {classData.professor.teacherProfile?.phone && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <strong>Phone:</strong> {classData.professor.teacherProfile.phone}
                                  </p>
                                )}
                                {classData.professor.teacherProfile?.website && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <strong>Website:</strong> 
                                    <a href={classData.professor.teacherProfile.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 ml-1">
                                      {classData.professor.teacherProfile.website}
                                    </a>
                                  </p>
                                )}
                                {classData.professor.teacherProfile?.linkedin && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <strong>LinkedIn:</strong> 
                                    <a href={classData.professor.teacherProfile.linkedin} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 ml-1">
                                      {classData.professor.teacherProfile.linkedin}
                                    </a>
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Research Interests */}
                            {classData.professor.teacherProfile?.researchInterests && (
                              <div className="mb-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <strong>Research Interests:</strong> {classData.professor.teacherProfile.researchInterests}
                                </p>
                              </div>
                            )}

                            {/* Qualifications */}
                            {classData.professor.teacherProfile?.qualifications && (
                              <div className="mb-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <strong>Qualifications:</strong> {classData.professor.teacherProfile.qualifications}
                                </p>
                              </div>
                            )}

                            {/* Experience */}
                            {classData.professor.teacherProfile?.experience && (
                              <div className="mb-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <strong>Experience:</strong> {classData.professor.teacherProfile.experience}
                                </p>
                              </div>
                            )}

                            {/* Bio */}
                            {classData.professor.bio ? (
                              <p className="text-gray-700 dark:text-gray-300">
                                {classData.professor.bio}
                              </p>
                            ) : (
                            <p className="text-gray-700 dark:text-gray-300">
                              Experienced educator with expertise in {classData.name} and related subjects. 
                              Committed to providing quality education and fostering student success through 
                              engaging learning experiences and practical applications.
                            </p>
                            )}
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
                    <CardTitle className="text-gray-900 dark:text-white">
                      {user?.role === 'STUDENT' && !isEnrolled ? 'Course Preview' : 'This Course Includes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{classData._count.notes} learning materials</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{classData._count.quizzes} quizzes</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{classData._count.assignments} assignments</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{classData._count.enrollments} enrolled students</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">Lifetime access</span>
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
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{classData._count.quizzes + classData._count.assignments + classData._count.notes}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment CTA for non-enrolled students */}
                    {user?.role === 'STUDENT' && !isEnrolled && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          onClick={handleEnroll}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Enroll Now
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                          Get access to all course materials
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          </div>
        </main>
      </div>

      {/* Invite Students Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invite Students</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            {/* Invite Type Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setInviteType('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inviteType === 'email'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email Invites
              </button>
              <button
                onClick={() => {
                  setInviteType('existing')
                  loadExistingStudents()
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inviteType === 'existing'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Existing Students
              </button>
            </div>

            {/* Email Invites Tab */}
            {inviteType === 'email' && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Send email invitations to students who are not yet registered on the platform.
                </p>
                
                <div className="space-y-3">
                  {emailInvites.map((email, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      />
                      {emailInvites.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveEmailField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={handleAddEmailField}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Email
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Students Tab */}
            {inviteType === 'existing' && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Invite students who are already enrolled in your other classes but not in this one.
                </p>
                
                {isLoadingStudents ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : existingStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No available students found.</p>
                    <p className="text-sm">All your students are already enrolled in this class.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {existingStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStudents.includes(student.id)
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => handleStudentToggle(student.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvites}
                disabled={isSendingInvites}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSendingInvites ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invites
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
