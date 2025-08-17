'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Users, Mail, GraduationCap, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
  description?: string
  _count: {
    enrollments: number
  }
}

export default function InviteStudentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [emailList, setEmailList] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [lastResults, setLastResults] = useState<any[]>([])
  const [resendEmails, setResendEmails] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadClasses()
    }
  }, [user])

  const loadClasses = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/classes', {
        headers: {
          'x-user-id': user.id
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      } else {
        console.error('Failed to load classes')
        setClasses([])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendEmails.length === 0) {
      toast.error('Please select emails to resend invitations')
      return
    }
    
    setEmailList(resendEmails.join('\n'))
    await handleInvite(true)
    setResendEmails([])
  }

  const handleInvite = async (forceResend = false) => {
    if (!selectedClass || !emailList.trim()) {
      toast.error('Please select a class and enter email addresses')
      return
    }

    const emails = emailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))

    if (emails.length === 0) {
      toast.error('Please enter valid email addresses')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/students/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          classId: selectedClass,
          emails: emails,
          forceResend: forceResend
        })
      })

      const data = await response.json()

      if (response.ok) {
        setLastResults(data.results || [])
        const successCount = data.results?.filter((r: any) => r.status === 'invited').length || 0
        const alreadyInvitedCount = data.results?.filter((r: any) => r.status === 'already_invited').length || 0
        const errorCount = data.results?.filter((r: any) => r.status === 'error').length || 0
        
        // Show different toast messages based on results
        if (successCount > 0 && alreadyInvitedCount === 0 && errorCount === 0) {
          toast.success(`✅ ${successCount} invitation${successCount > 1 ? 's' : ''} sent successfully!`)
        } else if (successCount > 0 && alreadyInvitedCount > 0 && errorCount === 0) {
          toast.success(`✅ ${successCount} invitation${successCount > 1 ? 's' : ''} sent successfully! ${alreadyInvitedCount} already invited.`)
        } else if (successCount === 0 && alreadyInvitedCount > 0 && errorCount === 0) {
          toast.success(`ℹ️ ${alreadyInvitedCount} email${alreadyInvitedCount > 1 ? 's' : ''} already invited. No new invitations sent.`)
        } else if (errorCount > 0) {
          toast.error(`❌ ${errorCount} invitation${errorCount > 1 ? 's' : ''} failed. ${successCount} sent successfully. ${alreadyInvitedCount} already invited.`)
        } else {
          toast.success(`Processed ${emails.length} emails: ${successCount} sent, ${alreadyInvitedCount} already invited, ${errorCount} failed`)
        }
        
        if (!forceResend) {
          setEmailList('')
          setSelectedClass('')
        }
      } else {
        toast.error(data.error || 'Failed to send invitations')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast.error('Failed to send invitations')
    } finally {
      setIsInviting(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailList(e.target.value)
  }

  const clearEmails = () => {
    setEmailList('')
    setLastResults([])
    setResendEmails([])
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
              <Button asChild variant="outline" className="mb-4">
                <Link href="/dashboard/students">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Students
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Invite Students</h1>
              <p className="text-gray-600 mt-2">Send invitations to students to join your classes</p>
            </div>

            <div className="max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Send Invitations</span>
                  </CardTitle>
                  <CardDescription>
                    Select a class and enter email addresses to invite students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class *
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a class...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.code} - {cls.name} ({cls._count.enrollments} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Student Email Addresses *
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearEmails}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <textarea
                      value={emailList}
                      onChange={handleEmailChange}
                      placeholder="Enter email addresses, one per line:&#10;student1@example.com&#10;student2@example.com&#10;student3@example.com"
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter one email address per line. Students will receive an invitation to join the selected class.
                    </p>
                  </div>

                  {/* Email Count */}
                  {emailList.trim() && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {emailList.split('\n').filter(email => email.trim() && email.includes('@')).length} valid email(s) ready to invite
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/students')}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleInvite(false)}
                      disabled={!selectedClass || !emailList.trim() || isInviting}
                      className="flex items-center space-x-2"
                    >
                      {isInviting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Sending Invitations...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Invitations</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Results Display */}
                  {lastResults.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">Invitation Results</h3>
                          {classes.find(c => c.id === selectedClass) && (
                            <p className="text-sm text-gray-600">
                              Class: {classes.find(c => c.id === selectedClass)?.name}
                            </p>
                          )}
                        </div>
                        {resendEmails.length > 0 && (
                          <Button 
                            onClick={handleResend}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Resend Selected ({resendEmails.length})
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {lastResults.map((result, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg border ${
                              result.status === 'invited' ? 'bg-green-50 border-green-200' :
                              result.status === 'already_invited' ? 'bg-blue-50 border-blue-200' :
                              'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                {result.status === 'already_invited' && (
                                  <input
                                    type="checkbox"
                                    checked={resendEmails.includes(result.email)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setResendEmails([...resendEmails, result.email])
                                      } else {
                                        setResendEmails(resendEmails.filter(email => email !== result.email))
                                      }
                                    }}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                  />
                                )}
                                <span className="font-medium">{result.email}</span>
                              </div>
                              <span className={`text-sm px-2 py-1 rounded ${
                                result.status === 'invited' ? 'bg-green-100 text-green-800' :
                                result.status === 'already_invited' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.status === 'invited' ? '✅ Sent' :
                                 result.status === 'already_invited' ? 'ℹ️ Already Invited' :
                                 '❌ Failed'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={() => {
                            setLastResults([])
                            setResendEmails([])
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Clear Results
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>How It Works</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Students will receive an email invitation to join your class</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>They can click the invitation link to create an account and enroll</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Once enrolled, they'll appear in your students list</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>You can track their progress and engagement in the analytics</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>If students are already invited, you can select them and resend invitations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
