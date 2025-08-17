'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SunEditorComponent } from '@/components/ui/SunEditor'
import { ArrowLeft, Plus, Trash2, Save, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
}

interface QuestionOption {
  text: string
  isCorrect: boolean
  explanation: string
}

interface PracticeQuestion {
  id: string
  title: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECTION' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  timeLimit?: number
  options?: QuestionOption[]
}

interface ImportedQuestion {
  id: string
  title: string
  content: string
  type: string
  difficulty: string
  points: number
  timeLimit?: number
  options?: QuestionOption[]
  source: {
    quizId: string
    quizTitle: string
    classId: string
    className: string
    classCode: string
  }
}

export default function CreatePracticeQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const classId = params.id as string
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClass, setIsLoadingClass] = useState(true)
  const [isLoadingImport, setIsLoadingImport] = useState(false)
  const [classData, setClassData] = useState<Class | null>(null)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [importedQuestions, setImportedQuestions] = useState<ImportedQuestion[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

  useEffect(() => {
    if (user && classId) {
      loadClassData()
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
      toast.error('Failed to load class data')
    } finally {
      setIsLoadingClass(false)
    }
  }

  const addQuestion = () => {
    const newQuestion: PracticeQuestion = {
      id: `q${Date.now()}`,
      title: '',
      content: '',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      points: 10,
      options: [
        { text: '', isCorrect: false, explanation: '' },
        { text: '', isCorrect: false, explanation: '' }
      ]
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  const updateQuestion = (questionId: string, updates: Partial<PracticeQuestion>) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const updatedQuestion = { ...q, ...updates }
        
        // Initialize options when switching to multiple choice or multiple selection
        if (updates.type === 'MULTIPLE_CHOICE' || updates.type === 'MULTIPLE_SELECTION') {
          if (!updatedQuestion.options || updatedQuestion.options.length === 0) {
            updatedQuestion.options = [
              { text: '', isCorrect: false, explanation: '' },
              { text: '', isCorrect: false, explanation: '' }
            ]
          }
        }
        
        // Clear options when switching to other question types
        if (updates.type === 'TRUE_FALSE' || updates.type === 'SHORT_ANSWER') {
          updatedQuestion.options = undefined
        }
        
        return updatedQuestion
      }
      return q
    }))
  }

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { 
          ...q, 
          options: [...q.options, { text: '', isCorrect: false, explanation: '' }] 
        }
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

  const updateOption = (questionId: string, optionIndex: number, field: keyof QuestionOption, value: string | boolean) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value }
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const loadImportedQuestions = async () => {
    setIsLoadingImport(true)
    try {
      const response = await fetch(`/api/quizzes/questions?classId=${classId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setImportedQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error loading imported questions:', error)
      toast.error('Failed to load questions from quizzes')
    } finally {
      setIsLoadingImport(false)
    }
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const importSelectedQuestions = () => {
    const questionsToImport = importedQuestions.filter(q => selectedQuestions.includes(q.id))
    
    const newQuestions: PracticeQuestion[] = questionsToImport.map(q => ({
      id: `imported_${q.id}_${Date.now()}`,
      title: q.title,
      content: q.content,
      type: q.type as any,
      difficulty: q.difficulty as any,
      points: q.points,
      timeLimit: q.timeLimit,
      options: q.options
    }))

    setQuestions([...questions, ...newQuestions])
    setSelectedQuestions([])
    setShowImportModal(false)
    toast.success(`Imported ${newQuestions.length} questions`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    // Validate all questions
    for (const question of questions) {
      if (!question.title.trim()) {
        toast.error('All questions must have a title')
        return
      }

      if (!question.content.trim()) {
        toast.error('All questions must have content')
        return
      }

      if (['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(question.type)) {
        if (!question.options || question.options.length < 2) {
          toast.error('Multiple choice/selection questions must have at least 2 options')
          return
        }

        const validOptions = question.options.filter(opt => opt.text.trim())
        if (validOptions.length < 2) {
          toast.error('All options must have text')
          return
        }

        const correctOptions = validOptions.filter(opt => opt.isCorrect)
        if (correctOptions.length === 0) {
          toast.error('Please select at least one correct answer for each question')
          return
        }

        if (question.type === 'MULTIPLE_CHOICE' && correctOptions.length > 1) {
          toast.error('Multiple choice questions can only have one correct answer')
          return
        }
      }
    }

    setIsLoading(true)

    try {
      // Create questions one by one
      for (const question of questions) {
        const questionData = {
          title: question.title.trim(),
          content: question.content,
          type: question.type,
          subject: classData?.name || '',
          difficulty: question.difficulty,
          points: question.points,
          timeLimit: question.timeLimit,
          options: ['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(question.type) 
            ? question.options?.filter(opt => opt.text.trim())
            : undefined
        }

        const response = await fetch('/api/practice/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
          },
          body: JSON.stringify(questionData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create question')
        }
      }

      toast.success(`Successfully created ${questions.length} practice questions!`)
      router.push(`/dashboard/practice/classes/${classId}`)
    } catch (error) {
      console.error('Error creating practice questions:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create questions')
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.role !== 'PROFESSOR') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only professors can create practice questions.</p>
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

  if (isLoadingClass) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
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
              <div className="flex items-center space-x-4 mb-6">
                <Button asChild variant="outline">
                  <Link href={`/dashboard/practice/classes/${classId}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Class
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Practice Questions</h1>
                <p className="text-gray-600 mt-2">
                  {classData ? `${classData.code} - ${classData.name}` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="max-w-6xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Action Buttons */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Questions ({questions.length})</CardTitle>
                        <CardDescription>Add multiple practice questions for your class</CardDescription>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          onClick={() => {
                            setShowImportModal(true)
                            loadImportedQuestions()
                          }}
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Import from Quizzes
                        </Button>
                        <Button
                          type="button"
                          onClick={addQuestion}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Questions List */}
                {questions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Added</h3>
                      <p className="text-gray-600 mb-6">Start by adding questions or importing from existing quizzes.</p>
                      <div className="flex justify-center space-x-3">
                        <Button
                          type="button"
                          onClick={() => {
                            setShowImportModal(true)
                            loadImportedQuestions()
                          }}
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Import from Quizzes
                        </Button>
                        <Button
                          type="button"
                          onClick={addQuestion}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Question
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <Card key={question.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <CardTitle>Question {index + 1}</CardTitle>
                                <CardDescription>{question.type.replace('_', ' ')}</CardDescription>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeQuestion(question.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Question Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Title *
                            </label>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter question title"
                              required
                            />
                          </div>

                          {/* Question Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Type *
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(question.id, { type: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="MULTIPLE_CHOICE">Multiple Choice (Single Answer)</option>
                              <option value="MULTIPLE_SELECTION">Multiple Selection (Multiple Answers)</option>
                              <option value="TRUE_FALSE">True/False</option>
                              <option value="SHORT_ANSWER">Short Answer</option>
                            </select>
                          </div>

                          {/* Difficulty */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Difficulty *
                            </label>
                            <select
                              value={question.difficulty}
                              onChange={(e) => updateQuestion(question.id, { difficulty: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="EASY">Easy</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HARD">Hard</option>
                            </select>
                          </div>

                          {/* Points */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={question.points}
                              onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          {/* Time Limit */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Time Limit (minutes) - Optional
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={question.timeLimit || ''}
                              onChange={(e) => updateQuestion(question.id, { timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave empty for no time limit"
                            />
                          </div>

                          {/* Question Content */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Content *
                            </label>
                            <SunEditorComponent
                              value={question.content}
                              onChange={(content) => updateQuestion(question.id, { content })}
                              placeholder="Enter your question content..."
                            />
                          </div>

                          {/* Options for Multiple Choice/Selection/True-False */}
                          {['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(question.type) && question.options && (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                  Answer Options *
                                </label>
                                <Button
                                  type="button"
                                  onClick={() => addOption(question.id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="space-y-4">
                                {question.options.map((option, optionIndex) => (
                                  <div key={optionIndex} className="border rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                      <div className="flex-1 space-y-3">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Option {optionIndex + 1} *
                                          </label>
                                          <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateOption(question.id, optionIndex, 'text', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Enter option ${optionIndex + 1}`}
                                            required
                                          />
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                          <label className="flex items-center">
                                            <input
                                              type={question.type === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                                              name={`correct-${question.id}`}
                                              checked={option.isCorrect}
                                              onChange={(e) => updateOption(question.id, optionIndex, 'isCorrect', e.target.checked)}
                                              className="mr-2"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Correct Answer</span>
                                          </label>
                                        </div>

                                        {option.isCorrect && (
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Explanation (Optional)
                                            </label>
                                            <textarea
                                              value={option.explanation}
                                              onChange={(e) => updateOption(question.id, optionIndex, 'explanation', e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="Explain why this answer is correct..."
                                              rows={3}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      
                                      {question.options && question.options.length > 2 && (
                                        <Button
                                          type="button"
                                          onClick={() => removeOption(question.id, optionIndex)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                {questions.length > 0 && (
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                      Create {questions.length} Question{questions.length !== 1 ? 's' : ''}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/practice/classes/${classId}`)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Import Questions from Quizzes</h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportModal(false)
                  setSelectedQuestions([])
                }}
              >
                ×
              </Button>
            </div>
            
            {isLoadingImport ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading questions from quizzes...</p>
              </div>
            ) : importedQuestions.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h4>
                <p className="text-gray-600">No quiz questions found for this class.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Found {importedQuestions.length} questions from quizzes
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => setSelectedQuestions(importedQuestions.map(q => q.id))}
                      variant="outline"
                      size="sm"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setSelectedQuestions([])}
                      variant="outline"
                      size="sm"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {importedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedQuestions.includes(question.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleQuestionSelection(question.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestionSelection(question.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{question.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{question.content}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{question.type.replace('_', ' ')}</span>
                            <span>{question.points} points</span>
                            <span>From: {question.source.quizTitle}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowImportModal(false)
                      setSelectedQuestions([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={importSelectedQuestions}
                    disabled={selectedQuestions.length === 0}
                  >
                    Import {selectedQuestions.length} Question{selectedQuestions.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
