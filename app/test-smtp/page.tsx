'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function TestSMTPPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleTestSMTP = async () => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: 'mainong.jenbum@gmail.com',
          subject: 'SMTP Test',
          message: 'This is a test to verify SMTP configuration.'
        })
      })

      const data = await response.json()
      console.log('SMTP test response:', data)
      setTestResult(data)

      if (response.ok) {
        toast.success('SMTP test completed! Check the results below.')
      } else {
        toast.error(data.error || 'SMTP test failed')
      }
    } catch (error) {
      console.error('Error testing SMTP:', error)
      toast.error('Error testing SMTP')
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration Test</CardTitle>
            <CardDescription>
              Test the email server connection and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Current SMTP Configuration:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Host:</strong> mail.classora.in</p>
                <p><strong>Port:</strong> 587</p>
                <p><strong>Security:</strong> Non-SSL</p>
                <p><strong>Username:</strong> support@classora.in</p>
                <p><strong>Authentication:</strong> Required</p>
              </div>
            </div>

            <Button 
              onClick={handleTestSMTP}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Testing SMTP Connection...</span>
                </>
              ) : (
                'Test SMTP Connection'
              )}
            </Button>

            {testResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Test Results:</h3>
                <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Troubleshooting:</h3>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• If you see "550 SMTP AUTH is required", the authentication is not working</p>
                <p>• Check if the username and password are correct</p>
                <p>• Verify the SMTP server settings with your email provider</p>
                <p>• Check if the email account has SMTP access enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
