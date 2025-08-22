'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, Plus, Minus, Code, FileText, Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classId: string
  class: {
    id: string
    name: string
    code: string
  }
}

interface Question {
  id?: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECTION' | 'SHORT_ANSWER'
  options?: string[]
  correctAnswer?: string
  correctAnswers?: string[]
  points: number
}

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    maxAttempts: 1,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  })
  const [questions, setQuestions] = useState<Question[]>([])

  const quizId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (user.role !== 'PROFESSOR') {
      router.push('/dashboard')
      return
    }

    loadQuiz()
  }, [user, router, quizId])

  const loadQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      
      if (response.ok) {
        const quizData = await response.json()
        setQuiz(quizData)
        setFormData({
          title: quizData.title,
          description: quizData.description || '',
          timeLimit: quizData.timeLimit || 30,
          maxAttempts: quizData.maxAttempts || 1,
          status: quizData.status
        })
        
        // Transform questions from database format to form format
        const transformedQuestions = quizData.questions.map((q: any) => ({
          id: q.id,
          text: q.question,
          type: q.type,
          points: q.points,
          options: q.options?.map((opt: any) => opt.text) || [],
          correctAnswer: q.options?.find((opt: any) => opt.isCorrect)?.text || '',
          correctAnswers: q.options?.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.text) || [],
        }))
        setQuestions(transformedQuestions)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load quiz')
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load quiz')
      router.push('/dashboard/quizzes')
    } finally {
      setIsLoading(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswers: [], // Initialize for multiple selection
      points: 1
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionIndex: number) => {
    setQuestions(questions.filter((_, index) => index !== questionIndex))
  }

  const updateQuestion = (questionIndex: number, updates: Partial<Question>) => {
    setQuestions(questions.map((q, index) => {
      if (index === questionIndex) {
        const updatedQuestion = { ...q, ...updates }
        
        // Initialize options when switching to multiple choice or multiple selection
        if (updates.type === 'MULTIPLE_CHOICE' || updates.type === 'MULTIPLE_SELECTION') {
          if (!updatedQuestion.options || updatedQuestion.options.length === 0) {
            updatedQuestion.options = ['', '', '', '']
          }
          if (updates.type === 'MULTIPLE_SELECTION' && !updatedQuestion.correctAnswers) {
            updatedQuestion.correctAnswers = []
          }
        }
        
        // Clear options when switching to other question types
        if (updates.type === 'TRUE_FALSE' || updates.type === 'SHORT_ANSWER') {
          updatedQuestion.options = undefined
          updatedQuestion.correctAnswers = undefined
        }
        
        return updatedQuestion
      }
      return q
    }))
  }

  const addOption = (questionIndex: number) => {
    setQuestions(questions.map((q, index) => {
      if (index === questionIndex && q.options) {
        return { ...q, options: [...q.options, ''] }
      }
      return q
    }))
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions(questions.map((q, index) => {
      if (index === questionIndex && q.options && q.options.length > 2) {
        const newOptions = q.options.filter((_, optIndex) => optIndex !== optionIndex)
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(questions.map((q, index) => {
      if (index === questionIndex && q.options) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const handleSubmit = async (e: React.FormEvent, status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED') => {
    e.preventDefault()
    
    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    // Validate questions
    for (const question of questions) {
      if (!question.text.trim()) {
        toast.error('All questions must have text')
        return
      }
      if (question.type === 'MULTIPLE_CHOICE' && (!question.options || question.options.length < 2)) {
        toast.error('Multiple choice questions must have at least 2 options')
        return
      }
      if (question.type === 'MULTIPLE_CHOICE' && !question.correctAnswer) {
        toast.error('Multiple choice questions must have a correct answer selected')
        return
      }
      if (question.type === 'MULTIPLE_SELECTION' && (!question.options || question.options.length < 2)) {
        toast.error('Multiple selection questions must have at least 2 options')
        return
      }
      if (question.type === 'MULTIPLE_SELECTION' && (!question.correctAnswers || question.correctAnswers.length === 0)) {
        toast.error('Multiple selection questions must have at least one correct answer selected')
        return
      }
      if (question.type === 'TRUE_FALSE' && !question.correctAnswer) {
        toast.error('True/False questions must have a correct answer selected')
        return
      }
    }

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        status: status || formData.status, // Use the passed status or fall back to form data
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers,
          points: q.points,
        }))
      }
      
      console.log('Sending quiz update payload:', payload)
      
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const statusMessage = status === 'PUBLISHED' ? 'published' : 'updated'
        toast.success(`Quiz ${statusMessage} successfully`)
        router.push('/dashboard/quizzes')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quiz')
      }
    } catch (error) {
      console.error('Error updating quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update quiz')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    await handleSubmit(new Event('submit') as any, 'DRAFT')
  }

  const handlePublish = async () => {
    await handleSubmit(new Event('submit') as any, 'PUBLISHED')
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

  if (!quiz) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
            <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/dashboard/quizzes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quizzes
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
        userRole="PROFESSOR"
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
                  <Link href="/dashboard/quizzes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quizzes
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
                <p className="text-gray-600 mt-2">Update your quiz questions and settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Quiz Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Quiz Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quiz Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter quiz title"
                          required
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter quiz description"
                          rows={3}
                        />
                      </div>

                      {/* Time Limit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 30 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="180"
                        />
                      </div>

                      {/* Max Attempts */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Attempts
                        </label>
                        <input
                          type="number"
                          value={formData.maxAttempts}
                          onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Number of times students can attempt this quiz
                        </p>
                      </div>



                      {/* Class Info (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class
                        </label>
                        <input
                          type="text"
                          value={`${quiz.class.code} - ${quiz.class.name}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Class cannot be changed after creation</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center space-x-2">
                          <Code className="h-5 w-5" />
                          <span>Questions ({questions.length})</span>
                        </CardTitle>
                        <Button type="button" onClick={addQuestion} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {questions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No questions added yet. Click "Add Question" to get started.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-medium">Question {questionIndex + 1}</h3>
                                <Button
                                  type="button"
                                  onClick={() => removeQuestion(questionIndex)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Question Text */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Text *
                                </label>
                                <textarea
                                  value={question.text}
                                  onChange={(e) => updateQuestion(questionIndex, { text: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter your question"
                                  rows={3}
                                  required
                                />
                              </div>

                              {/* Question Type */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Type
                                </label>
                                <select
                                  value={question.type}
                                  onChange={(e) => updateQuestion(questionIndex, { type: e.target.value as any })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                  <option value="MULTIPLE_SELECTION">Multiple Selection</option>
                                  <option value="TRUE_FALSE">True/False</option>
                                  <option value="SHORT_ANSWER">Short Answer</option>
                                </select>
                              </div>

                              {/* Options for Multiple Choice */}
                              {question.type === 'MULTIPLE_CHOICE' && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Options
                                  </label>
                                  <div className="space-y-2">
                                    {(question.options || ['', '', '', '']).map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder={`Option ${optionIndex + 1}`}
                                        />
                                        <input
                                          type="radio"
                                          name={`correct-${questionIndex}`}
                                          value={option}
                                          checked={question.correctAnswer === option}
                                          onChange={(e) => updateQuestion(questionIndex, { correctAnswer: e.target.value })}
                                          className="text-blue-600"
                                        />
                                        <span className="text-sm text-gray-500">Correct</span>
                                        {question.options && question.options.length > 2 && (
                                          <Button
                                            type="button"
                                            onClick={() => removeOption(questionIndex, optionIndex)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      onClick={() => addOption(questionIndex)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Option
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Options for Multiple Selection */}
                              {question.type === 'MULTIPLE_SELECTION' && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Options
                                  </label>
                                  <div className="space-y-2">
                                    {(question.options || ['', '', '', '']).map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder={`Option ${optionIndex + 1}`}
                                        />
                                        <input
                                          type="checkbox"
                                          checked={question.correctAnswers?.includes(option) || false}
                                          onChange={(e) => {
                                            const currentAnswers = question.correctAnswers || []
                                            const newAnswers = e.target.checked
                                              ? [...currentAnswers, option]
                                              : currentAnswers.filter(ans => ans !== option)
                                            updateQuestion(questionIndex, { correctAnswers: newAnswers })
                                          }}
                                          className="text-blue-600"
                                        />
                                        <span className="text-sm text-gray-500">Correct</span>
                                        {question.options && question.options.length > 2 && (
                                          <Button
                                            type="button"
                                            onClick={() => removeOption(questionIndex, optionIndex)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      onClick={() => addOption(questionIndex)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Option
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Correct Answer for True/False */}
                              {question.type === 'TRUE_FALSE' && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Correct Answer
                                  </label>
                                  <select
                                    value={question.correctAnswer || ''}
                                    onChange={(e) => updateQuestion(questionIndex, { correctAnswer: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select correct answer</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                </div>
                              )}

                              {/* Points */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Points
                                </label>
                                <input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(questionIndex, { points: parseInt(e.target.value) || 1 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="1"
                                  max="10"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <Button asChild variant="outline">
                      <Link href="/dashboard/quizzes">
                        Cancel
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      variant="outline"
                    >
                      {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePublish}
                      disabled={isSaving}
                    >
                      {isSaving ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4 mr-2" />}
                      Publish Quiz
                    </Button>
                  </div>
                </form>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quiz Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Code className="w-4 h-4 text-gray-500" />
                      <span>{questions.length} questions</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{formData.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>{quiz.class.code} - {quiz.class.name}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>• Make sure each question is clear and unambiguous</p>
                    <p>• For multiple choice, provide 4-5 options</p>
                    <p>• Save as draft to work on it later</p>
                    <p>• Publish when ready for students to take</p>
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
