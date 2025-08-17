'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function DebugInvitePage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('mainong.jenbum@gmail.com')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleTestInvite = async () => {
    if (!user) {
      toast.error('Please log in first')
      return
    }

    setIsLoading(true)
    setDebugInfo(null)
    
    try {
      console.log('🧪 Testing invitation with:', {
        userId: user.id,
        userRole: user.role,
        email: email
      })

      // Step 1: Get classes
      const classesResponse = await fetch(`/api/classes?professorId=${user.id}`, {
        headers: {
          'x-user-id': user.id
        }
      })
      
      const classesData = await classesResponse.json()
      console.log('📚 Classes response:', classesData)
      
      if (!classesResponse.ok || !classesData.classes || classesData.classes.length === 0) {
        toast.error('No classes found. Please create a class first.')
        setDebugInfo({ error: 'No classes found', classesData })
        return
      }

      const classId = classesData.classes[0].id
      console.log('🎯 Using class ID:', classId)

      // Step 2: Send invitation
      const inviteResponse = await fetch('/api/students/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          classId: classId,
          emails: [email]
        })
      })

      const inviteData = await inviteResponse.json()
      console.log('📧 Invitation response:', inviteData)
      
      setDebugInfo({
        classesData,
        inviteData,
        success: inviteResponse.ok
      })

      if (inviteResponse.ok) {
        toast.success('Invitation test completed! Check debug info below.')
      } else {
        toast.error(inviteData.error || 'Invitation failed')
      }
    } catch (error) {
      console.error('❌ Error testing invitation:', error)
      toast.error('Error testing invitation')
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to debug the invitation system</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (user.role !== 'PROFESSOR') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only professors can test the invitation system</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Debug Invitation System</CardTitle>
            <CardDescription>
              Step-by-step debugging of the invitation system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Current User:</h3>
              <p className="text-sm text-blue-700">ID: {user.id}</p>
              <p className="text-sm text-blue-700">Name: {user.name}</p>
              <p className="text-sm text-blue-700">Role: {user.role}</p>
            </div>

            {/* Test Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Email:</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              
              <Button 
                onClick={handleTestInvite}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Testing Invitation System...</span>
                  </>
                ) : (
                  'Test Invitation System'
                )}
              </Button>
            </div>

            {/* Debug Results */}
            {debugInfo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Debug Results:</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Debugging Steps:</h3>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>1. Check if user is authenticated and has professor role</p>
                <p>2. Fetch classes for the professor</p>
                <p>3. Send invitation to the test email</p>
                <p>4. Check the response and any errors</p>
                <p>5. Look at the browser console for detailed logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
