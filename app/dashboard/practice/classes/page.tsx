'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { BookOpen, ArrowLeft, Target, Users } from 'lucide-react'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  code: string
  description?: string
  questionCount: number
}

export default function PracticeClassesPage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])

  useEffect(() => {
    if (user) {
      loadClasses()
    }
  }, [user])

  const loadClasses = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/practice/classes', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setIsLoading(false)
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
                  <Link href="/dashboard/practice">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Practice
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Practice Classes</h1>
                <p className="text-gray-600 mt-2">Choose a class to start practicing</p>
              </div>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{classItem.code}</CardTitle>
                          <CardDescription>{classItem.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {classItem.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {classItem.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Target className="w-4 h-4" />
                          <span>{classItem.questionCount} questions</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/practice/classes/${classItem.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button 
                            asChild 
                            size="sm"
                            disabled={classItem.questionCount === 0}
                          >
                            <Link href={`/dashboard/practice/classes/${classItem.id}/start`}>
                              Start Practice
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
                  <p className="text-gray-600 mb-6">
                    {user?.role === 'PROFESSOR' 
                      ? 'You haven\'t created any classes yet. Create a class to add practice questions.'
                      : 'No classes are available for practice at the moment.'
                    }
                  </p>
                  {user?.role === 'PROFESSOR' && (
                    <Button asChild>
                      <Link href="/dashboard/classes">
                        Create Class
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
