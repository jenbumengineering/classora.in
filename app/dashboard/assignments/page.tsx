'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FileText, Plus, Edit, Trash2, Calendar, Users, Eye } from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  className: string
  dueDate: string | null
  category: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  createdAt: string
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAssignments()
    }
  }, [user])

  const loadAssignments = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/assignments', {
        headers: {
          'x-user-id': user.id
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      } else {
        console.error('Failed to load assignments')
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Create and manage assignments for your students' 
                : 'View assignments from your enrolled classes'
              }
            </p>
          </div>
          {user?.role === 'PROFESSOR' && (
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/dashboard/assignments/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium mb-2">
                  {user?.role === 'PROFESSOR' ? 'No assignments yet' : 'No assignments available'}
                </h3>
                <p className="mb-4">
                  {user?.role === 'PROFESSOR' 
                    ? 'Create your first assignment to engage your students'
                    : 'Assignments will appear here once your professors create them'
                  }
                </p>
                {user?.role === 'PROFESSOR' && (
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link href="/dashboard/assignments/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Assignment
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-gray-900 dark:text-white">{assignment.title}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {assignment.className}
                      </CardDescription>
                    </div>
                    {user?.role === 'PROFESSOR' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {assignment.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      {assignment.dueDate && (
                        <>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Link href={`/dashboard/assignments/${assignment.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
