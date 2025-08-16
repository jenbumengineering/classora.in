'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BookOpen, Search, Filter, Plus, Clock, Target, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface PracticeQuestion {
  id: string
  title: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER'
  class: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  timeLimit?: number
  createdAt: string
  _count: {
    attempts: number
  }
}

export default function PracticeQuestionsPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<PracticeQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedClass, setSelectedClass] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')

  useEffect(() => {
    if (user) {
      loadQuestions()
    }
  }, [user])

  useEffect(() => {
    filterQuestions()
  }, [questions, searchTerm, selectedType, selectedClass, selectedDifficulty])

  const loadQuestions = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/practice/questions', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error loading practice questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.class.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(q => q.type === selectedType)
    }

    // Filter by class
    if (selectedClass !== 'All') {
      filtered = filtered.filter(q => q.class === selectedClass)
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty)
    }

    setFilteredQuestions(filtered)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return <Target className="w-4 h-4" />
      case 'SHORT_ANSWER': return <BookOpen className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'HARD': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const types = ['All', 'MULTIPLE_CHOICE', 'SHORT_ANSWER']
  const classes = ['All', 'Programming', 'Algorithms', 'Databases', 'Mathematics']
  const difficulties = ['All', 'EASY', 'MEDIUM', 'HARD']

  if (isLoading) {
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
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Practice Questions</h1>
                  <p className="text-gray-600 mt-2">Sharpen your skills with practice questions</p>
                </div>
                {user?.role === 'PROFESSOR' && (
                  <Button asChild>
                    <Link href="/dashboard/practice/questions/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Type Filter */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {types.map(type => (
                      <option key={type} value={type}>Type: {type}</option>
                    ))}
                  </select>

                  {/* Class Filter */}
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {classes.map(classItem => (
                      <option key={classItem} value={classItem}>Class: {classItem}</option>
                    ))}
                  </select>

                  {/* Difficulty Filter */}
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>Difficulty: {difficulty}</option>
                    ))}
                  </select>

                  {/* Clear Filters */}
                                      <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedType('All')
                        setSelectedClass('All')
                        setSelectedDifficulty('All')
                      }}
                    >
                      Clear Filters
                    </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(question.type)}
                        <span className="text-sm font-medium text-gray-600">{question.type.replace('_', ' ')}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{question.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {question.content}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{question.class}</span>
                        <span>{question.points} points</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{question.timeLimit || 'No limit'} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{question._count.attempts} attempts</span>
                        </div>
                      </div>

                      <Button asChild className="w-full">
                        <Link href={`/dashboard/practice/questions/${question.id}`}>
                          Start Practice
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredQuestions.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
                                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedType('All')
                        setSelectedClass('All')
                        setSelectedDifficulty('All')
                      }}
                    >
                      Clear All Filters
                    </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
