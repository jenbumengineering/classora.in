'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface InvitationData {
  id: string
  email: string
  classId: string
  className: string
  professorName: string
  status: string
  expiresAt: string
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      validateInvitation()
    } else {
      setError('Invalid invitation link')
      setIsLoading(false)
    }
  }, [token])

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`)
      if (response.ok) {
        const data = await response.json()
        setInvitation(data.invitation)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid invitation')
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      setError('Failed to validate invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user) {
      toast.error('Please log in to accept the invitation')
      router.push('/auth/login')
      return
    }

    if (!token) {
      toast.error('Invalid invitation token')
      return
    }

    setIsAccepting(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleRegister = () => {
    router.push('/auth/register')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invitation Not Found</CardTitle>
            <CardDescription>The invitation you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date() > new Date(invitation.expiresAt)
  const isAccepted = invitation.status === 'ACCEPTED'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isExpired ? (
            <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          ) : isAccepted ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          ) : (
            <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          )}
          
          <CardTitle>
            {isExpired ? 'Invitation Expired' : 
             isAccepted ? 'Invitation Accepted' : 
             'Class Invitation'}
          </CardTitle>
          
          <CardDescription>
            {isExpired ? 'This invitation has expired' :
             isAccepted ? 'You have already accepted this invitation' :
             `You're invited to join ${invitation.className}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isExpired && !isAccepted && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{invitation.className}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <User className="w-4 h-4" />
                  <span>Invited by {invitation.professorName}</span>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-yellow-800">
                  <Clock className="w-4 h-4" />
                  <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Please log in or create an account to accept this invitation
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleLogin} variant="outline">
                      Log In
                    </Button>
                    <Button onClick={handleRegister}>
                      Create Account
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleAcceptInvitation} 
                  disabled={isAccepting}
                  className="w-full"
                >
                  {isAccepting ? (
                    <>
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Accepting...
                    </>
                  ) : (
                    'Accept Invitation'
                  )}
                </Button>
              )}
            </>
          )}

          {(isExpired || isAccepted) && (
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
