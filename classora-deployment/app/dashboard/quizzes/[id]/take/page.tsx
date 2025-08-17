'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Play, Check, X, Clock, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number
  maxAttempts: number
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  classId: string
  class: {
    id: string
    name: string
    code: string
  }
}

interface QuizAttempt {
  id: string
  score: number
  completedAt: string
  timeSpent: number
}

interface Question {
  id: string
  question: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECTION' | 'SHORT_ANSWER'
  points: number
  options?: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
}

interface Answer {
  questionId: string
  selectedOptions?: string[]
  textAnswer?: string
}

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(0)

  const quizId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'STUDENT') {
      router.push('/dashboard')
      return
    }

    loadQuiz()
    loadAttempts()
  }, [user, router, quizId])

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining])

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
        setQuestions(quizData.questions)
        
        // Initialize answers array
        const initialAnswers = quizData.questions.map((q: Question) => ({
          questionId: q.id,
          selectedOptions: [],
          textAnswer: ''
        }))
        setAnswers(initialAnswers)
        
        // Set timer
        const timeLimit = quizData.timeLimit || 30
        setTimeRemaining(timeLimit * 60) // Convert to seconds
        setStartTime(new Date())
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

  const loadAttempts = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAttempts(data.attempts || [])
        setCurrentAttemptNumber(data.attempts.length + 1)
      }
    } catch (error) {
      console.error('Error loading attempts:', error)
    }
  }

  const updateAnswer = (questionId: string, updates: Partial<Answer>) => {
    setAnswers(prev => prev.map(answer => 
      answer.questionId === questionId ? { ...answer, ...updates } : answer
    ))
  }

  const handleOptionSelect = (questionId: string, optionText: string, isMultiple: boolean = false) => {
    const currentAnswer = answers.find(a => a.questionId === questionId)
    
    if (isMultiple) {
      // Multiple selection
      const currentOptions = currentAnswer?.selectedOptions || []
      const newOptions = currentOptions.includes(optionText)
        ? currentOptions.filter(opt => opt !== optionText)
        : [...currentOptions, optionText]
      
      updateAnswer(questionId, { selectedOptions: newOptions })
    } else {
      // Single selection
      updateAnswer(questionId, { selectedOptions: [optionText] })
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          quizId: quizId,
          startTime: startTime?.toISOString(),
          answers: answers
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Quiz submitted! Score: ${result.score}/${result.totalPoints} (${result.percentage.toFixed(1)}%)`)
        router.push('/dashboard/quizzes')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit quiz')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers.find(a => a.questionId === question.id)

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option, optionIndex) => (
              <label key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.text}
                  checked={currentAnswer?.selectedOptions?.includes(option.text) || false}
                  onChange={() => handleOptionSelect(question.id, option.text)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        )

      case 'MULTIPLE_SELECTION':
        return (
          <div className="space-y-3">
            {question.options?.map((option, optionIndex) => (
              <label key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.text}
                  checked={currentAnswer?.selectedOptions?.includes(option.text) || false}
                  onChange={() => handleOptionSelect(question.id, option.text, true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        )

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={currentAnswer?.selectedOptions?.includes('true') || false}
                onChange={() => handleOptionSelect(question.id, 'true')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900">True</span>
            </label>
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={currentAnswer?.selectedOptions?.includes('false') || false}
                onChange={() => handleOptionSelect(question.id, 'false')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900">False</span>
            </label>
          </div>
        )

      case 'SHORT_ANSWER':
        return (
          <div>
            <textarea
              value={currentAnswer?.textAnswer || ''}
              onChange={(e) => updateAnswer(question.id, { textAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your answer..."
              rows={4}
            />
          </div>
        )

      default:
        return <p className="text-gray-500">Unsupported question type</p>
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

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole="STUDENT"
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
                
                {/* Timer */}
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-gray-600 mt-2">{quiz.description}</p>
                
                {/* Attempt Information */}
                <div className="mt-4 flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">Attempt:</span>
                    <span className="font-medium text-blue-600">{currentAttemptNumber}</span>
                  </div>
                  {attempts.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Best Score:</span>
                      <span className="font-medium text-green-600">
                        {Math.max(...attempts.map(a => a.score || 0))} points
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Question {currentQuestionIndex + 1} of {totalQuestions}</CardTitle>
                        <CardDescription>{currentQuestion?.type.replace('_', ' ')} • {currentQuestion?.points} points</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-900">{currentQuestion?.question}</p>
                    </div>
                    
                    {currentQuestion && renderQuestion(currentQuestion, currentQuestionIndex)}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-3">
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Submit Quiz
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {questions.map((question, index) => {
                        const answer = answers.find(a => a.questionId === question.id)
                        const hasAnswer = answer && (
                          (answer.selectedOptions && answer.selectedOptions.length > 0) ||
                          answer.textAnswer?.trim()
                        )
                        
                        return (
                          <button
                            key={question.id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              index === currentQuestionIndex
                                ? 'border-blue-500 bg-blue-50'
                                : hasAnswer
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Question {index + 1}</span>
                              {hasAnswer && <Check className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{question.type.replace('_', ' ')}</p>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quiz Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Class:</span>
                      <p className="text-sm text-gray-600">{quiz.class.code} - {quiz.class.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Time Limit:</span>
                      <p className="text-sm text-gray-600">{quiz.timeLimit} minutes</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Attempt History */}
                {attempts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Attempt History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {attempts.map((attempt, index) => (
                          <div key={attempt.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Attempt {attempts.length - index}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(attempt.completedAt || new Date()).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>Score: {attempt.score || 0} points</div>
                              {attempt.timeSpent && (
                                <div>Time: {Math.floor(attempt.timeSpent / 60)}:{(attempt.timeSpent % 60).toString().padStart(2, '0')}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
