'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
                <p className="text-gray-600 mt-2">
                  {user?.role === 'PROFESSOR' 
                    ? 'Create and manage assignments for your students' 
                    : 'View assignments from your enrolled classes'
                  }
                </p>
              </div>
              {user?.role === 'PROFESSOR' && (
                <Button asChild>
                  <Link href="/dashboard/assignments/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Link>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : assignments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                    <p className="mb-4">
                      {user?.role === 'PROFESSOR' 
                        ? 'Create your first assignment to challenge your students.'
                        : 'You are not enrolled in any classes with assignments yet.'
                      }
                    </p>
                    {user?.role === 'PROFESSOR' && (
                      <Button asChild>
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
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription>{assignment.className}</CardDescription>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                          assignment.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {assignment.status === 'PUBLISHED' ? 'Published' : 
                           assignment.status === 'DRAFT' ? 'Draft' : 'Closed'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-600 line-clamp-2 mb-4">
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: assignment.description || '<p>No description provided.</p>' }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {assignment.dueDate 
                              ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}`
                              : 'No due date'
                            }
                          </span>
                        </div>
                        {assignment.category && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{assignment.category}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/assignments/${assignment.id}`}>
                              View
                            </Link>
                          </Button>
                          {user?.role === 'PROFESSOR' && (
                            <>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
