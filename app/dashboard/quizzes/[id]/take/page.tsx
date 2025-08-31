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
  explanation?: string
  options?: Array<{
    id: string
    text: string
    isCorrect: boolean
    explanation?: string
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
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [questionResults, setQuestionResults] = useState<Map<string, { isCorrect: boolean; explanation?: string }>>(new Map())

  const quizId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
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
        
        // Check if student is enrolled in the class
        const enrollmentResponse = await fetch(`/api/enrollments?studentId=${user?.id}&classId=${quizData.class.id}`, {
          headers: {
            'x-user-id': user?.id || ''
          }
        })
        
        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json()
          const isEnrolled = enrollmentData.enrollments.some((e: any) => e.classId === quizData.class.id)
          
          if (!isEnrolled) {
            toast.error('You must be enrolled in this class to take this quiz')
            router.push('/dashboard/quizzes')
            return
          }
        } else {
          toast.error('Unable to verify enrollment status')
          router.push('/dashboard/quizzes')
          return
        }
        
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

  const handleOptionSelect = (questionId: string, optionId: string, isMultiple: boolean = false) => {
    const currentAnswer = answers.find(a => a.questionId === questionId)
    
    if (isMultiple) {
      // Multiple selection
      const currentOptions = currentAnswer?.selectedOptions || []
      const newOptions = currentOptions.includes(optionId)
        ? currentOptions.filter(opt => opt !== optionId)
        : [...currentOptions, optionId]
      
      updateAnswer(questionId, { selectedOptions: newOptions })
    } else {
      // Single selection
      updateAnswer(questionId, { selectedOptions: [optionId] })
    }
  }

  const evaluateCurrentQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
    if (!currentAnswer || !currentAnswer.selectedOptions || currentAnswer.selectedOptions.length === 0) return

    // Check if answer is correct
    let isCorrect = false

    if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      const correctOption = currentQuestion.options?.find(opt => opt.isCorrect)
      isCorrect = currentAnswer.selectedOptions[0] === correctOption?.id
    } else if (currentQuestion.type === 'MULTIPLE_SELECTION') {
      const correctOptionIds = currentQuestion.options?.filter(opt => opt.isCorrect).map(opt => opt.id) || []
      const selectedOptionIds = currentAnswer.selectedOptions
      isCorrect = correctOptionIds.length === selectedOptionIds.length &&
                  correctOptionIds.every(id => selectedOptionIds.includes(id))
    } else if (currentQuestion.type === 'TRUE_FALSE') {
      const correctOption = currentQuestion.options?.find(opt => opt.isCorrect)
      isCorrect = currentAnswer.selectedOptions[0] === correctOption?.id
    }

    // Only show explanation for correct answers
    const explanation = isCorrect ? currentQuestion.explanation || '' : ''

    // Update results
    setQuestionResults(prev => new Map(prev).set(currentQuestion.id, { isCorrect, explanation }))
    setAnsweredQuestions(prev => new Set(prev).add(currentQuestion.id))
  }

  const handleNextQuestion = () => {
    // Evaluate current question before moving to next
    evaluateCurrentQuestion()
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
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
    const questionResult = questionResults.get(question.id)
    const isAnswered = answeredQuestions.has(question.id)

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option, optionIndex) => (
              <label key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={currentAnswer?.selectedOptions?.includes(option.id) || false}
                  onChange={() => handleOptionSelect(question.id, option.id)}
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
                  value={option.id}
                  checked={currentAnswer?.selectedOptions?.includes(option.id) || false}
                  onChange={() => handleOptionSelect(question.id, option.id, true)}
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
            {question.options?.map((option, optionIndex) => (
              <label key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={currentAnswer?.selectedOptions?.includes(option.id) || false}
                  onChange={() => handleOptionSelect(question.id, option.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option.text}</span>
              </label>
            ))}
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
                    
                    {/* Show explanation only for correct answers */}
                    {questionResults.get(currentQuestion.id)?.isCorrect && questionResults.get(currentQuestion.id)?.explanation && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-green-800">
                              Correct! Here's why:
                            </h4>
                            <p className="mt-1 text-sm text-green-700">
                              {questionResults.get(currentQuestion.id)?.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-3">
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        onClick={handleNextQuestion}
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
                        const isAnswered = answeredQuestions.has(question.id)
                        const isCorrect = questionResults.get(question.id)?.isCorrect
                        
                        return (
                          <button
                            key={question.id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              index === currentQuestionIndex
                                ? 'border-blue-500 bg-blue-50'
                                : isAnswered && isCorrect
                                ? 'border-green-500 bg-green-50'
                                : isAnswered && !isCorrect
                                ? 'border-red-500 bg-red-50'
                                : hasAnswer
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Question {index + 1}</span>
                              {isAnswered && isCorrect && <Check className="w-4 h-4 text-green-600" />}
                              {isAnswered && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                              {hasAnswer && !isAnswered && <div className="w-4 h-4 border-2 border-yellow-400 rounded-full" />}
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
