'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, Eye, EyeOff, Code, Clock, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
  description?: string
}

interface Note {
  id: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED' | 'PRIVATE'
  classId: string
}

interface Question {
  id: string
  text: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECTION' | 'SHORT_ANSWER'
  options?: string[]
  correctAnswer?: string
  correctAnswers?: string[] // For multiple selection
  points: number
  explanation?: string // General explanation for the question
}

export default function NewQuizPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  })

  useEffect(() => {
    if (user?.role !== 'PROFESSOR') {
      router.push('/dashboard')
      return
    }

    loadClasses()
  }, [user, router])

  const loadClasses = async () => {
    try {
      const response = await fetch(`/api/classes?professorId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const loadNotes = async (classId: string) => {
    try {
      const response = await fetch(`/api/notes?classId=${classId}&professorId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      toast.error('Failed to load notes')
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswers: [], // Initialize for multiple selection
      points: 1,
      explanation: ''
    }
    setQuestions([...questions, newQuestion])
    
    // Auto-scroll to the new question after a short delay to allow DOM update
    setTimeout(() => {
      const questionElement = document.getElementById(`question-${newQuestion.id}`)
      if (questionElement) {
        questionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
        // Add a subtle highlight effect
        questionElement.classList.add('ring-2', 'ring-orange-500', 'ring-opacity-50')
        setTimeout(() => {
          questionElement.classList.remove('ring-2', 'ring-orange-500', 'ring-opacity-50')
        }, 2000)
      }
    }, 100)
  }

  // Handle class selection change
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setSelectedNoteId('') // Reset note selection when class changes
    if (classId) {
      loadNotes(classId)
    } else {
      setNotes([])
    }
  }

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const updatedQuestion = { ...q, ...updates }
        
        // Initialize options when switching to multiple choice or multiple selection
        if (updates.type === 'MULTIPLE_CHOICE' || updates.type === 'MULTIPLE_SELECTION') {
          if (!updatedQuestion.options || updatedQuestion.options.length === 0) {
            updatedQuestion.options = [
              { text: '', isCorrect: false, explanation: '' },
              { text: '', isCorrect: false, explanation: '' },
              { text: '', isCorrect: false, explanation: '' },
              { text: '', isCorrect: false, explanation: '' }
            ]
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

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: [...q.options, ''] }
      }
      return q
    }))
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = q.options.filter((_, index) => index !== optionIndex)
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const handleSubmit = async (e?: React.FormEvent | 'DRAFT' | 'PUBLISHED' | 'CLOSED', status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED') => {
    // Handle both form submissions and direct calls
    if (e && typeof e === 'object' && 'preventDefault' in e) {
      e.preventDefault()
    }
    
    // Determine the status
    const finalStatus = status || (typeof e === 'string' ? e : formData.status)
    
    if (!selectedClassId) {
      toast.error('Please select a class')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

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
      if (question.type === 'MULTIPLE_SELECTION' && (!question.options || question.options.length < 2)) {
        toast.error('Multiple selection questions must have at least 2 options')
        return
      }
      if (question.type === 'TRUE_FALSE' && !question.correctAnswer) {
        toast.error('True/False questions must have a correct answer selected')
        return
      }
    }

    setIsLoading(true)

    try {
      const requestBody = {
        ...formData,
        status: finalStatus, // Use the determined status
        classId: selectedClassId,
        noteId: selectedNoteId,
        questions: questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers,
          points: q.points,
          explanation: q.explanation,
        }))
      }
      
      console.log('Sending quiz data:', requestBody)
      
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const newQuiz = await response.json()
        const statusMessage = finalStatus === 'PUBLISHED' ? 'published' : 'saved as draft'
        toast.success(`Quiz ${statusMessage} successfully!`)
        router.push(`/dashboard/quizzes`)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        if (errorData.details) {
          const validationErrors = errorData.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
          throw new Error(`Validation error: ${validationErrors}`)
        }
        throw new Error(errorData.error || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create quiz')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    await handleSubmit('DRAFT')
  }

  const handlePublish = async () => {
    await handleSubmit('PUBLISHED')
  }

  if (user?.role !== 'PROFESSOR') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only professors can create quizzes.</p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
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
                  <Link href="/dashboard/quizzes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quizzes
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
                <p className="text-gray-600 mt-2">Design a quiz to test your students' knowledge</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Quiz Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz Details</CardTitle>
                      <CardDescription>Basic information about your quiz</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Class Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class *
                        </label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => handleClassChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a class</option>
                          {classes.map((classData) => (
                            <option key={classData.id} value={classData.id}>
                              {classData.code} - {classData.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Note Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Related Note (Optional)
                        </label>
                        <select
                          value={selectedNoteId}
                          onChange={(e) => setSelectedNoteId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a note (optional)</option>
                          {notes.map((note) => (
                            <option key={note.id} value={note.id}>
                              {note.title}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Linking a note helps students understand the context of the quiz
                        </p>
                      </div>

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
                          onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="180"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Questions</CardTitle>
                          <CardDescription>Add questions to your quiz</CardDescription>
                        </div>
                        <Button
                          type="button"
                          onClick={addQuestion}
                          variant="outline"
                          size="sm"
                        >
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
                          {questions.map((question, index) => (
                            <div key={question.id} id={`question-${question.id}`} className="border border-gray-200 rounded-lg p-4 transition-all duration-300">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-medium">Question {index + 1}</h4>
                                <Button
                                  type="button"
                                  onClick={() => removeQuestion(question.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
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
                                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter your question"
                                  rows={2}
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
                                  onChange={(e) => updateQuestion(question.id, { type: e.target.value as any })}
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
                                  <div className="space-y-4">
                                    {(question.options || []).map((option, optionIndex) => (
                                      <div key={optionIndex} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Option ${optionIndex + 1}`}
                                          />
                                          <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={question.correctAnswer === option}
                                            onChange={(e) => {
                                              updateQuestion(question.id, { correctAnswer: option })
                                            }}
                                            className="text-blue-600"
                                          />
                                          <span className="text-sm text-gray-500">Correct</span>
                                          {question.options && question.options.length > 2 && (
                                            <Button
                                              type="button"
                                              onClick={() => removeOption(question.id, optionIndex)}
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-600"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      onClick={() => addOption(question.id)}
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
                                  <div className="space-y-4">
                                    {(question.options || []).map((option, optionIndex) => (
                                      <div key={optionIndex} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
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
                                              updateQuestion(question.id, { correctAnswers: newAnswers })
                                            }}
                                            className="text-blue-600"
                                          />
                                          <span className="text-sm text-gray-500">Correct</span>
                                          {question.options && question.options.length > 2 && (
                                            <Button
                                              type="button"
                                              onClick={() => removeOption(question.id, optionIndex)}
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-600"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      onClick={() => addOption(question.id)}
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
                                    onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                  >
                                    <option value="">Select correct answer</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                </div>
                              )}

                              {/* Points */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Points
                                </label>
                                <input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="1"
                                  max="100"
                                />
                              </div>

                              {/* Question Explanation */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Explanation for Correct Answer (Optional)
                                </label>
                                <textarea
                                  value={question.explanation || ''}
                                  onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Explain why the correct answer is right (shown to students after answering)"
                                  rows={2}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  This explanation will be shown to students when they answer correctly
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isLoading}
                      variant="outline"
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePublish}
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4 mr-2" />}
                      Publish Quiz
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push('/dashboard/quizzes')}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quiz Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Draft</span>
                      <span className="text-xs text-gray-500">- Only you can see this</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Published</span>
                      <span className="text-xs text-gray-500">- Students can take this quiz</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Closed</span>
                      <span className="text-xs text-gray-500">- Quiz is no longer available</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>• Use clear, concise questions</p>
                    <p>• Mix different question types</p>
                    <p>• Set appropriate time limits</p>
                    <p>• Review questions before publishing</p>
                    <p>• Save as draft to work on later</p>
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
