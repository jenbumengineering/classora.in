'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Edit, Calendar, BookOpen, FileText, Users, Download, Upload, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { StudentSubmissionsSection } from '@/components/dashboard/StudentSubmissionsSection'

interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  className: string
  dueDate: string
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  category: string
  fileUrl: string
  createdAt: string
  updatedAt: string
  professor: {
    id: string
    name: string
    email: string
  }
  _count?: {
    submissions: number
  }
}

interface AssignmentSubmission {
  id: string
  fileUrl: string
  feedback: string | null
  submittedAt: string
  grade: number | null
  gradedAt: string | null
}

export default function AssignmentViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true)
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && params.id) {
      loadAssignment()
      if (user.role === 'STUDENT') {
        loadSubmission()
      }
    }
  }, [user, params.id])

  const loadAssignment = async () => {
    if (!user || !params.id) return

    try {
      const response = await fetch(`/api/assignments/${params.id}`, {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        
        // For students, check if they are enrolled in the class
        if (user?.role === 'STUDENT') {
          const enrollmentResponse = await fetch(`/api/enrollments?studentId=${user.id}&classId=${data.classId}`, {
            headers: {
              'x-user-id': user.id
            }
          })
          
          if (enrollmentResponse.ok) {
            const enrollmentData = await enrollmentResponse.json()
            const isEnrolled = enrollmentData.enrollments.some((e: any) => e.classId === data.classId)
            
            if (!isEnrolled) {
              toast.error('You must be enrolled in this class to view this assignment')
              router.push('/dashboard/assignments')
              return
            }
          } else {
            toast.error('Unable to verify enrollment status')
            router.push('/dashboard/assignments')
            return
          }
        }
        
        setAssignment(data)
      } else if (response.status === 404) {
        toast.error('Assignment not found')
        router.push('/dashboard/assignments')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(errorData.error || 'Failed to load assignment')
      }
    } catch (error) {
      console.error('Error loading assignment:', error)
      toast.error('Failed to load assignment')
    } finally {
      setIsLoadingAssignment(false)
      setIsLoading(false)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${params.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      })

      if (response.ok) {
        toast.success('Assignment deleted successfully!')
        router.push('/dashboard/assignments') // Redirect to assignments list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete assignment')
    }
  }

  const loadSubmission = async () => {
    if (!user || !params.id) return

    try {
      const response = await fetch(`/api/assignments/${params.id}/submission`, {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSubmission(data.submission)
      }
    } catch (error) {
      console.error('Error loading submission:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !user || !assignment) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('assignmentId', assignment.id)
      formData.append('file', selectedFile)
      if (feedback.trim()) {
        formData.append('feedback', feedback.trim())
      }

      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: {
          'x-user-id': user.id
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const isResubmission = data.isResubmission
        toast.success(isResubmission ? 'Assignment resubmitted successfully!' : 'Assignment submitted successfully!')
        setSubmission({
          id: data.submissionId,
          fileUrl: data.fileUrl,
          feedback: feedback.trim() || null,
          submittedAt: data.submittedAt,
          grade: null, // Reset grade for resubmission
          gradedAt: null
        })
        setSelectedFile(null)
        setFeedback('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      toast.error('Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isAssignmentOverdue = () => {
    if (!assignment?.dueDate) return false
    return new Date() > new Date(assignment.dueDate)
  }

  const canSubmit = () => {
    if (!assignment || user?.role !== 'STUDENT') return false
    if (assignment.status !== 'PUBLISHED') return false
    if (isAssignmentOverdue()) return false
    // Prevent resubmission if assignment is graded
    if (submission && submission.grade !== null) return false
    return true
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'CLOSED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Published'
      case 'DRAFT':
        return 'Draft'
      case 'CLOSED':
        return 'Closed'
      default:
        return status
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

  if (!assignment) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignment Not Found</h2>
            <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/assignments">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignments
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
        userRole={user?.role || 'STUDENT'}
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
                  <Link href="/dashboard/assignments">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Assignments
                  </Link>
                </Button>
                {user?.role === 'PROFESSOR' && (
                  <>
                    <Button asChild>
                      <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Assignment
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAssignment}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Assignment
                    </Button>
                  </>
                )}
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                  <p className="text-gray-600 mt-2">{assignment.className}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                  {getStatusText(assignment.status)}
                </div>
              </div>
            </div>

            <div className="max-w-4xl space-y-6">
              {/* Assignment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <div 
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: assignment.description || '<p>No description provided.</p>' }}
                    />
                  </div>

                  {/* Assignment File */}
                  {assignment.fileUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Assignment File</h3>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-blue-700">Assignment file attached</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>Due Date:</strong> {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                    {assignment.category && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          <strong>Category:</strong> {assignment.category}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong>Created by:</strong> {assignment.professor.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>
                        <strong>Created:</strong> {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Summary</CardTitle>
                  <CardDescription>
                    {user?.role === 'PROFESSOR' ? 'Submission statistics and overview' : 'Your submission status and grade'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.role === 'PROFESSOR' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {assignment._count?.submissions || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Submissions</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {assignment._count?.submissions || 0}
                        </div>
                        <div className="text-sm text-gray-600">Submitted</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 mb-2">
                          {assignment._count?.submissions ? 
                            Math.round((assignment._count.submissions / (assignment._count?.submissions || 1)) * 100) : 0
                          }%
                        </div>
                        <div className="text-sm text-gray-600">Submission Rate</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submission ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-green-600 mb-2">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Submission Status</span>
                            </div>
                            <div className="text-sm text-gray-700">
                              <strong>Status:</strong> {submission.grade !== null ? 'Graded' : 'Submitted'}
                            </div>
                            <div className="text-sm text-gray-700">
                              <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}
                            </div>
                            {submission.grade !== null && (
                              <div className="text-sm text-gray-700">
                                <strong>Grade:</strong> {submission.grade} points
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-600 mb-2">
                              <FileText className="w-5 h-5" />
                              <span className="font-medium">Assignment File</span>
                            </div>
                            <div className="text-sm text-gray-700 mb-2">
                              Your submitted file is available for download
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Download Submission
                              </a>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <div className="flex items-center space-x-2 text-yellow-600 mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">Not Submitted</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            You haven't submitted this assignment yet. 
                            {assignment.dueDate && new Date(assignment.dueDate) < new Date() && (
                              <span className="text-red-600 font-medium"> This assignment is overdue.</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Student Actions (if student) */}
              {user?.role === 'STUDENT' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Assignment</CardTitle>
                    <CardDescription>
                      {submission ? 'Your submission details' : 'Upload your completed assignment'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submission ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Assignment Submitted</span>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Submitted File:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                          {submission.feedback && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Your feedback:</strong> {submission.feedback}
                            </div>
                          )}
                        </div>

                        {submission.grade !== null && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-600 mb-2">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Graded</span>
                            </div>
                            <div className="text-sm text-gray-700">
                              <strong>Grade:</strong> {submission.grade} points
                              {submission.gradedAt && (
                                <span className="ml-4">
                                  Graded on: {new Date(submission.gradedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Resubmission Section */}
                        {submission && submission.grade !== null ? (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 text-gray-700 mb-3">
                              <XCircle className="w-5 h-5" />
                              <span className="font-medium">Assignment Graded</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-4">
                              This assignment has been graded and cannot be resubmitted. Contact your professor if you need to discuss your grade.
                            </p>
                          </div>
                        ) : canSubmit() ? (
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-2 text-yellow-700 mb-3">
                              <Upload className="w-5 h-5" />
                              <span className="font-medium">Resubmit Assignment</span>
                            </div>
                            <p className="text-sm text-yellow-700 mb-4">
                              You can resubmit this assignment. Your previous submission will be replaced.
                            </p>
                            
                            {/* File Upload for Resubmission */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  New Assignment File *
                                </label>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  onChange={handleFileSelect}
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isSubmitting}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Allowed formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 50MB)
                                </p>
                              </div>

                              {/* Feedback for Resubmission */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Additional Feedback (Optional)
                                </label>
                                <textarea
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Add any comments or feedback about your resubmission..."
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isSubmitting}
                                />
                              </div>

                              {/* Resubmit Button */}
                              <div className="flex justify-end">
                                <Button
                                  onClick={handleSubmit}
                                  disabled={!selectedFile || isSubmitting}
                                  className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <LoadingSpinner size="sm" />
                                      <span>Resubmitting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      <span>Resubmit Assignment</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!canSubmit() && (
                          <div className="p-4 bg-red-50 rounded-lg">
                            <div className="flex items-center space-x-2 text-red-600 mb-2">
                              <XCircle className="w-5 h-5" />
                              <span className="font-medium">Cannot Submit</span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {assignment?.status !== 'PUBLISHED' && 'This assignment is not available for submission.'}
                              {isAssignmentOverdue() && 'The due date has passed. Late submissions are not allowed.'}
                            </div>
                          </div>
                        )}

                        {canSubmit() && (
                          <>
                            {/* File Upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assignment File *
                              </label>
                              <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Allowed formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 50MB)
                              </p>
                            </div>

                            {/* Feedback */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Feedback (Optional)
                              </label>
                              <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Add any comments or feedback about your submission..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                              <Button
                                onClick={handleSubmit}
                                disabled={!selectedFile || isSubmitting}
                                className="flex items-center space-x-2"
                              >
                                {isSubmitting ? (
                                  <>
                                    <LoadingSpinner size="sm" />
                                    <span>Submitting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    <span>Submit Assignment</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Professor Actions (if professor) */}
              {user?.role === 'PROFESSOR' && (
                <StudentSubmissionsSection assignmentId={assignment.id} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
