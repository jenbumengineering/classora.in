'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FileText, Users, Download, Star, Clock, UserCheck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface StudentSubmissionsSectionProps {
  assignmentId: string
}

export function StudentSubmissionsSection({ assignmentId }: StudentSubmissionsSectionProps) {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [studentsWithoutSubmission, setStudentsWithoutSubmission] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    totalSubmitted: 0,
    totalGraded: 0
  })
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (user && assignmentId) {
      loadSubmissions()
    }
  }, [user, assignmentId])

  const loadSubmissions = async () => {
    if (!user || !assignmentId) return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
        setStudentsWithoutSubmission(data.studentsWithoutSubmission || [])
        setStats({
          totalEnrolled: data.totalEnrolled || 0,
          totalSubmitted: data.totalSubmitted || 0,
          totalGraded: data.totalGraded || 0
        })
      } else {
        console.error('Failed to load submissions')
        toast.error('Failed to load student submissions')
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load student submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGradeSubmission = async (submissionId: string) => {
    if (!grade.trim()) {
      toast.error('Please enter a grade')
      return
    }

    const gradeValue = parseFloat(grade)
    if (isNaN(gradeValue) || gradeValue < 0) {
      toast.error('Please enter a valid grade')
      return
    }

    setGradingSubmission(submissionId)
    try {
      const response = await fetch(`/api/assignments/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user!.id
        },
        body: JSON.stringify({
          grade: gradeValue,
          feedback: feedback.trim() || null
        })
      })

      if (response.ok) {
        toast.success('Submission graded successfully!')
        setGrade('')
        setFeedback('')
        setGradingSubmission(null)
        loadSubmissions() // Reload to get updated data
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to grade submission')
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('Failed to grade submission')
    } finally {
      setGradingSubmission(null)
    }
  }

  const getSubmissionStatus = (submission: any) => {
    if (submission.grade !== null) {
      return { text: 'Graded', color: 'text-green-600', bg: 'bg-green-100' }
    }
    return { text: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-100' }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>View and grade student submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>View and grade student submissions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubmissions}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Loading...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Total Enrolled</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalEnrolled}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Submitted</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.totalSubmitted}</p>
            {stats.totalEnrolled > 0 && (
              <p className="text-sm text-green-700">
                {Math.round((stats.totalSubmitted / stats.totalEnrolled) * 100)}% submission rate
              </p>
            )}
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Graded</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.totalGraded}</p>
            {stats.totalSubmitted > 0 && (
              <p className="text-sm text-purple-700">
                {Math.round((stats.totalGraded / stats.totalSubmitted) * 100)}% graded
              </p>
            )}
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Submitted Assignments</h3>
            {submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                    <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatus(submission).bg} ${getSubmissionStatus(submission).color}`}>
                    {getSubmissionStatus(submission).text}
                  </div>
                </div>

                {/* File Download */}
                {submission.fileUrl && (
                  <div className="mb-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Download Submission
                      </a>
                    </Button>
                  </div>
                )}

                {/* Student Feedback */}
                {submission.feedback && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Student Feedback:</strong> {submission.feedback}
                    </p>
                  </div>
                )}

                {/* Grading Section */}
                {submission.grade !== null && gradingSubmission !== submission.id ? (
                  <div className="p-3 bg-green-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Grade: {submission.grade} points
                        </p>
                        {submission.feedback && (
                          <p className="text-sm text-green-700 mt-1">
                            Feedback: {submission.feedback}
                          </p>
                        )}
                        <p className="text-xs text-green-600 mt-1">
                          Graded on: {new Date(submission.gradedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGrade(submission.grade.toString())
                          setFeedback(submission.feedback || '')
                          setGradingSubmission(submission.id)
                        }}
                      >
                        Edit Grade
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade (points)
                        </label>
                        <input
                          type="number"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          placeholder="Enter grade"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Feedback (optional)
                        </label>
                        <input
                          type="text"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Enter feedback"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleGradeSubmission(submission.id)}
                        disabled={gradingSubmission === submission.id}
                        className="flex-1"
                      >
                        {gradingSubmission === submission.id ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Grading...</span>
                          </>
                        ) : (
                          submission.grade !== null ? 'Update Grade' : 'Grade Submission'
                        )}
                      </Button>
                      {submission.grade !== null && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setGradingSubmission(null)
                            setGrade('')
                            setFeedback('')
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No submissions yet</p>
          </div>
        )}

        {/* Students Without Submissions */}
        {studentsWithoutSubmission.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Students Without Submissions</h3>
            <div className="space-y-2">
              {studentsWithoutSubmission.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">No submission</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
