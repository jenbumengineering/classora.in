'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleTestEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test Email from Classora.in',
          message: 'This is a test email to verify the email configuration is working properly.'
        })
      })

      const data = await response.json()
      console.log('Email test response:', data)

      if (response.ok) {
        toast.success('Test email sent successfully! Check your inbox.')
      } else {
        toast.error(data.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error('Error sending test email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Email Configuration</CardTitle>
            <CardDescription>
              Send a test email to verify the email system is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Test Email Address:</label>
              <Input
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleTestEmail}
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Sending Test Email...</span>
                </>
              ) : (
                'Send Test Email'
              )}
            </Button>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Email Configuration:</h3>
              <p className="text-sm text-blue-700">Host: mail.classora.in:587</p>
              <p className="text-sm text-blue-700">User: support@classora.in</p>
              <p className="text-sm text-blue-700">Security: Non-SSL</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
