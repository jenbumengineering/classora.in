'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  ArrowLeft, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Globe, 
  Linkedin, 
  BookOpen, 
  Users,
  Calendar,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TeacherProfile {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  createdAt: string
  teacherProfile?: {
    university?: string
    college?: string
    department?: string
    address?: string
    phone?: string
    website?: string
    linkedin?: string
    researchInterests?: string
    qualifications?: string
    experience?: string
  }
  classes: {
    id: string
    name: string
    code: string
    description?: string
    createdAt: string
    _count: {
      enrollments: number
      notes: number
      quizzes: number
      assignments: number
    }
  }[]
  _count: {
    classes: number
  }
}

export default function TeacherProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const teacherId = params.id as string

  useEffect(() => {
    if (teacherId) {
      loadTeacherProfile()
    }
  }, [teacherId])

  const loadTeacherProfile = async () => {
    try {
      const response = await fetch(`/api/teachers/${teacherId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Teacher not found')
          router.push('/classes')
          return
        }
        throw new Error('Failed to load teacher profile')
      }
      const data = await response.json()
      setTeacher(data)
    } catch (error) {
      console.error('Error loading teacher profile:', error)
      toast.error('Failed to load teacher profile')
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

  if (!teacher) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Teacher Not Found</h2>
            <p className="text-gray-600 mb-6">The teacher you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/classes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === teacher.id

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
                  <Link href="/classes">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Classes
                  </Link>
                </Button>
                {isOwnProfile && (
                  <Button asChild>
                    <Link href="/dashboard/profile">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Teacher Profile */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5" />
                      <span>Professor {teacher.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-6">
                      <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{teacher.name}</h2>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{teacher.email}</span>
                          </div>
                          {teacher.teacherProfile?.university && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{teacher.teacherProfile.university}</span>
                              {teacher.teacherProfile.department && (
                                <span>• {teacher.teacherProfile.department}</span>
                              )}
                            </div>
                          )}
                          {teacher.teacherProfile?.college && (
                            <div className="text-gray-600">
                              <span>{teacher.teacherProfile.college}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio */}
                {teacher.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{teacher.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Qualifications & Experience */}
                {(teacher.teacherProfile?.qualifications || teacher.teacherProfile?.experience) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Qualifications & Experience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {teacher.teacherProfile?.qualifications && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Qualifications</h4>
                          <p className="text-gray-700">{teacher.teacherProfile.qualifications}</p>
                        </div>
                      )}
                      {teacher.teacherProfile?.experience && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                          <p className="text-gray-700">{teacher.teacherProfile.experience}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Research Interests */}
                {teacher.teacherProfile?.researchInterests && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Research Interests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{teacher.teacherProfile.researchInterests}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Classes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Classes ({teacher._count.classes})</CardTitle>
                    <CardDescription>Classes taught by this professor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teacher.classes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No classes available yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {teacher.classes.map((classData) => (
                          <div key={classData.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{classData.name}</h3>
                                <p className="text-sm text-gray-600 font-mono">{classData.code}</p>
                                {classData.description && (
                                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                    {classData.description}
                                  </p>
                                )}
                              </div>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/classes/${classData.id}`}>
                                  View Class
                                </Link>
                              </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{classData._count.enrollments}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{classData._count.notes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{classData._count.quizzes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{classData._count.assignments}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{teacher.email}</span>
                    </div>
                    {teacher.teacherProfile?.phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{teacher.teacherProfile.phone}</span>
                      </div>
                    )}
                    {teacher.teacherProfile?.address && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{teacher.teacherProfile.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Links */}
                {(teacher.teacherProfile?.website || teacher.teacherProfile?.linkedin) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {teacher.teacherProfile?.website && (
                        <Button asChild variant="outline" className="w-full justify-start">
                          <a href={teacher.teacherProfile.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {teacher.teacherProfile?.linkedin && (
                        <Button asChild variant="outline" className="w-full justify-start">
                          <a href={teacher.teacherProfile.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Classes</span>
                      <span className="text-sm font-medium">{teacher._count.classes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Students</span>
                      <span className="text-sm font-medium">
                        {teacher.classes.reduce((sum, classData) => sum + classData._count.enrollments, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </span>
                    </div>
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
