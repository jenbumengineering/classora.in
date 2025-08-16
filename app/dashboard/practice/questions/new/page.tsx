'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, Plus, Minus, BookOpen, Target, Clock } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NewPracticeQuestionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [questionType, setQuestionType] = useState<'MULTIPLE_CHOICE' | 'SHORT_ANSWER'>('MULTIPLE_CHOICE')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    points: 5,
    timeLimit: 5
  })

  const questionTypes = ['MULTIPLE_CHOICE', 'SHORT_ANSWER']
  const subjects = ['Programming', 'Algorithms', 'Databases', 'Mathematics', 'Computer Science']
  const difficulties = ['EASY', 'MEDIUM', 'HARD']

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
      // Reset correct answer if it was the removed option
      if (correctAnswer === options[index]) {
        setCorrectAnswer('')
      }
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    // Reset correct answer if it was the updated option
    if (correctAnswer === options[index]) {
      setCorrectAnswer('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Please enter question content')
      return
    }

    if (!formData.subject) {
      toast.error('Please select a subject')
      return
    }

    if (questionType === 'MULTIPLE_CHOICE') {
      if (options.length < 2) {
        toast.error('Please add at least 2 options')
        return
      }

      if (options.some(option => !option.trim())) {
        toast.error('Please fill in all options')
        return
      }

      if (!correctAnswer) {
        toast.error('Please select a correct answer')
        return
      }
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/practice/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          ...formData,
          type: questionType,
          options: questionType === 'MULTIPLE_CHOICE' ? options : undefined,
          correctAnswer: questionType === 'MULTIPLE_CHOICE' ? correctAnswer : undefined,
        }),
      })

      if (response.ok) {
        toast.success('Practice question created successfully!')
        router.push('/dashboard/practice/questions')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create practice question')
      }
    } catch (error) {
      console.error('Error creating practice question:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create practice question')
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
                  <Link href="/dashboard/practice/questions">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Questions
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Practice Question</h1>
                <p className="text-gray-600 mt-2">Add a new practice question for students</p>
              </div>
            </div>

            <div className="max-w-4xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Question Information</CardTitle>
                    <CardDescription>Basic details about your practice question</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter question title"
                        required
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Content *
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your question"
                        rows={4}
                        required
                      />
                    </div>

                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type *
                      </label>
                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value as 'MULTIPLE_CHOICE' | 'SHORT_ANSWER')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {questionTypes.map(type => (
                          <option key={type} value={type}>
                            {type.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a subject</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {difficulties.map(difficulty => (
                          <option key={difficulty} value={difficulty}>{difficulty}</option>
                        ))}
                      </select>
                    </div>

                    {/* Points */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
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
                        onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 5 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="60"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Multiple Choice Options */}
                {questionType === 'MULTIPLE_CHOICE' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Multiple Choice Options</CardTitle>
                      <CardDescription>Add options for the multiple choice question</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={option}
                            checked={correctAnswer === option}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-500">Correct</span>
                          {options.length > 2 && (
                            <Button
                              type="button"
                              onClick={() => removeOption(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={addOption}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                    Create Question
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/dashboard/practice/questions')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
