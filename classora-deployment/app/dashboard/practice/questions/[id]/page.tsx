'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Clock, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PracticeQuestion {
  id: string
  title: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECTION' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  class: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  timeLimit?: number
  options?: {
    id: string
    text: string
    isCorrect: boolean
    explanation?: string
  }[]
}

interface PracticeAttempt {
  id: string
  questionId: string
  studentId: string
  selectedAnswers: string[]
  isCorrect: boolean
  score: number
  timeSpent: number
  submittedAt: string
}

export default function PracticeQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const questionId = params.id as string
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [question, setQuestion] = useState<PracticeQuestion | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [shortAnswer, setShortAnswer] = useState('')
  const [timeSpent, setTimeSpent] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attempt, setAttempt] = useState<PracticeAttempt | null>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (user && questionId) {
      loadQuestion()
      startTimer()
    }
  }, [user, questionId])

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }

  const loadQuestion = async () => {
    try {
      const response = await fetch(`/api/practice/questions/${questionId}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuestion(data.question)
      } else {
        toast.error('Question not found')
        router.push('/dashboard/practice/questions')
      }
    } catch (error) {
      console.error('Error loading question:', error)
      toast.error('Failed to load question')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (answerId: string, isMultiple: boolean = false) => {
    if (isMultiple) {
      setSelectedAnswers(prev => 
        prev.includes(answerId)
          ? prev.filter(id => id !== answerId)
          : [...prev, answerId]
      )
    } else {
      setSelectedAnswers([answerId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question) return

    // Validate answers
    if (['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(question.type)) {
      if (selectedAnswers.length === 0) {
        toast.error('Please select an answer')
        return
      }
    } else if (question.type === 'SHORT_ANSWER') {
      if (!shortAnswer.trim()) {
        toast.error('Please enter your answer')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const attemptData = {
        questionId: question.id,
        selectedAnswers: question.type === 'SHORT_ANSWER' ? [shortAnswer] : selectedAnswers,
        timeSpent
      }

      const response = await fetch('/api/practice/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(attemptData),
      })

      if (response.ok) {
        const data = await response.json()
        setAttempt(data.attempt)
        setIsSubmitted(true)
        setShowResults(true)
        toast.success('Answer submitted successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit answer')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
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
          
          <main className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </main>
        </div>
      </div>
    )
  }

  if (!question) {
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
          
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Question Not Found</h3>
              <p className="text-gray-600 mb-4">The question you're looking for doesn't exist.</p>
              <Button asChild>
                <Link href="/dashboard/practice/questions">
                  Back to Questions
                </Link>
              </Button>
            </div>
          </main>
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
                  <Link href="/dashboard/practice/questions">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Questions
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
                  <p className="text-gray-600 mt-2">{question.class}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(timeSpent)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>{question.points} points</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Question</CardTitle>
                  <CardDescription>{question.type.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Content */}
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: question.content }} />
                  </div>

                  {/* Answer Section */}
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Multiple Choice/Selection/True-False Options */}
                      {['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(question.type) && question.options && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-medium">Select your answer:</h3>
                          {question.options.map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedAnswers.includes(option.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type={question.type === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                                name={question.type === 'MULTIPLE_CHOICE' ? 'answer' : `answer-${option.id}`}
                                value={option.id}
                                checked={selectedAnswers.includes(option.id)}
                                onChange={() => handleAnswerChange(option.id, question.type === 'MULTIPLE_SELECTION')}
                                className="mt-1"
                              />
                              <span className="flex-1">{option.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Short Answer */}
                      {question.type === 'SHORT_ANSWER' && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-medium">Your answer:</h3>
                          <textarea
                            value={shortAnswer}
                            onChange={(e) => setShortAnswer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your answer..."
                            rows={4}
                            required
                          />
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="min-w-[120px]"
                        >
                          {isSubmitting ? <LoadingSpinner size="sm" /> : 'Submit Answer'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Results Section */
                    <div className="space-y-6">
                      <div className={`p-4 rounded-lg ${
                        attempt?.isCorrect 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {attempt?.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <h3 className={`text-lg font-medium ${
                            attempt?.isCorrect ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {attempt?.isCorrect ? 'Correct!' : 'Incorrect'}
                          </h3>
                        </div>
                        <p className={`mt-2 ${
                          attempt?.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Score: {attempt?.score} / {question.points} points
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Time spent: {formatTime(attempt?.timeSpent || 0)}
                        </p>
                      </div>

                      {/* Show correct answers and explanations */}
                      {['MULTIPLE_CHOICE', 'MULTIPLE_SELECTION', 'TRUE_FALSE'].includes(question.type) && question.options && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-medium">Correct Answers:</h3>
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`p-4 border rounded-lg ${
                                option.isCorrect ? 'border-green-200 bg-green-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  option.isCorrect ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                  {option.isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <span className={option.isCorrect ? 'font-medium text-green-800' : 'text-gray-600'}>
                                    {option.text}
                                  </span>
                                  {option.isCorrect && option.explanation && (
                                    <p className="text-sm text-green-700 mt-1">
                                      {option.explanation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3">
                        <Button asChild variant="outline">
                          <Link href="/dashboard/practice/questions">
                            Back to Questions
                          </Link>
                        </Button>
                        <Button asChild>
                          <Link href="/dashboard/practice">
                            Practice More
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
