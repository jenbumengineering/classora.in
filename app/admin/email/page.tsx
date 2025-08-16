'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Mail, 
  Send, 
  TestTube, 
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Users,
  FileText,
  BookOpen,
  Award
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface EmailTestResult {
  success: boolean
  message?: string
  error?: string
  details?: string
  messageId?: string
  results?: any[]
  workingConfigs?: any[]
}

export default function AdminEmail() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<EmailTestResult | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')

  const emailTemplates = [
    {
      id: 'connection',
      name: 'Connection Test',
      description: 'Test email server connection',
      icon: <TestTube className="w-5 h-5" />
    },
    {
      id: 'contact',
      name: 'Contact Form',
      description: 'Contact form submission notification',
      icon: <Mail className="w-5 h-5" />
    },
    {
      id: 'assignment_submission',
      name: 'Assignment Submission',
      description: 'New assignment submission notification',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'assignment_graded',
      name: 'Assignment Graded',
      description: 'Assignment graded notification',
      icon: <Award className="w-5 h-5" />
    },
    {
      id: 'new_assignment',
      name: 'New Assignment',
      description: 'New assignment available notification',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'new_quiz',
      name: 'New Quiz',
      description: 'New quiz available notification',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'new_note',
      name: 'New Note',
      description: 'New note available notification',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'welcome',
      name: 'Welcome Email',
      description: 'Welcome email for new users',
      icon: <Users className="w-5 h-5" />
    }
  ]

  const testEmail = async (testType: string) => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType,
          recipientEmail: recipientEmail || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: result.message,
          messageId: result.messageId
        })
        toast.success(result.message)
      } else {
        setTestResult({
          success: false,
          error: result.error,
          details: result.details
        })
        toast.error(result.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Error testing email:', error)
      setTestResult({
        success: false,
        error: 'Network error',
        details: 'Failed to connect to the server'
      })
      toast.error('Network error occurred')
    } finally {
      setTesting(false)
    }
  }

  const testAllConfigurations = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/test-email-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: result.message,
          results: result.results,
          workingConfigs: result.workingConfigs
        })
        toast.success(result.message)
      } else {
        setTestResult({
          success: false,
          error: result.message,
          results: result.results
        })
        toast.error(result.message || 'Failed to test configurations')
      }
    } catch (error) {
      console.error('Error testing configurations:', error)
      setTestResult({
        success: false,
        error: 'Network error',
        details: 'Failed to connect to the server'
      })
      toast.error('Network error occurred')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
                <p className="text-gray-600">Test and manage email functionality</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Email Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Email Configuration
            </CardTitle>
            <CardDescription>Current email server settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">SMTP Server</h4>
                <p className="text-sm text-gray-600">mail.classora.in:587 (Non-SSL)</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">From Address</h4>
                <p className="text-sm text-gray-600">support@classora.in</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Recipient */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Test Recipient
            </CardTitle>
            <CardDescription>Set the email address for test emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <input
                type="email"
                placeholder="Enter email address for testing"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => testEmail('connection')}
                disabled={testing}
                variant="outline"
              >
                {testing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Button
                onClick={() => testAllConfigurations()}
                disabled={testing}
                variant="outline"
                className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                {testing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test All Configs
              </Button>
            </div>
            {testResult && (
              <div className={`mt-4 p-3 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-medium">
                    {testResult.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <p className="text-sm mt-1">{testResult.message || testResult.error}</p>
                {testResult.details && (
                  <p className="text-xs mt-1 opacity-75">{testResult.details}</p>
                )}
                {testResult.messageId && (
                  <p className="text-xs mt-1 opacity-75">Message ID: {testResult.messageId}</p>
                )}
                
                {/* Show detailed configuration results */}
                {testResult.results && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Configuration Test Results:</p>
                    {testResult.results.map((result: any, index: number) => (
                      <div key={index} className={`p-2 rounded text-xs ${
                        result.success 
                          ? 'bg-green-100 border border-green-300' 
                          : 'bg-red-100 border border-red-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.config}</span>
                          <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                            {result.success ? '✓ Success' : '✗ Failed'}
                          </span>
                        </div>
                        {result.success && result.messageId && (
                          <p className="text-xs mt-1">Message ID: {result.messageId}</p>
                        )}
                        {!result.success && result.error && (
                          <p className="text-xs mt-1 text-red-600">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Email Templates
            </CardTitle>
            <CardDescription>Test different email templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-blue-600">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => testEmail(template.id)}
                    disabled={testing}
                    size="sm"
                    className="w-full"
                  >
                    {testing ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="w-3 h-3 mr-2" />
                    )}
                    Send Test
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
