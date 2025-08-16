'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  AlertTriangle, 
  Bug, 
  Clock, 
  FileText, 
  ArrowLeft,
  Eye,
  Trash2,
  Download,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface CrashReport {
  id: string
  type: 'error' | 'warning' | 'critical'
  message: string
  stackTrace: string
  timestamp: string
  userId?: string
  userAgent: string
  url: string
  resolved: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export default function AdminCrashes() {
  const { user } = useAuth()
  const [crashes, setCrashes] = useState<CrashReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCrash, setSelectedCrash] = useState<CrashReport | null>(null)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCrashes()
  }, [])

  const fetchCrashes = async () => {
    try {
      const response = await fetch('/api/admin/crashes', {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCrashes(data.crashes || [])
      }
    } catch (error) {
      console.error('Error fetching crashes:', error)
      toast.error('Failed to load crash reports')
    } finally {
      setLoading(false)
    }
  }

  const markAsResolved = async (crashId: string) => {
    try {
      const response = await fetch(`/api/admin/crashes/${crashId}/resolve`, {
        method: 'PUT',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        setCrashes(prev => prev.map(crash => 
          crash.id === crashId ? { ...crash, resolved: true } : crash
        ))
        toast.success('Crash marked as resolved')
      }
    } catch (error) {
      console.error('Error marking crash as resolved:', error)
      toast.error('Failed to mark crash as resolved')
    }
  }

  const deleteCrash = async (crashId: string) => {
    if (!confirm('Are you sure you want to delete this crash report?')) return

    try {
      const response = await fetch(`/api/admin/crashes/${crashId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        setCrashes(prev => prev.filter(crash => crash.id !== crashId))
        if (selectedCrash?.id === crashId) {
          setSelectedCrash(null)
        }
        toast.success('Crash report deleted')
      }
    } catch (error) {
      console.error('Error deleting crash:', error)
      toast.error('Failed to delete crash report')
    }
  }

  const exportCrashes = async () => {
    try {
      const response = await fetch('/api/admin/crashes/export', {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `crash-reports-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Crash reports exported successfully')
      }
    } catch (error) {
      console.error('Error exporting crashes:', error)
      toast.error('Failed to export crash reports')
    }
  }

  const filteredCrashes = crashes.filter(crash => {
    // Status filter
    if (filter === 'unresolved' && crash.resolved) return false
    if (filter === 'resolved' && !crash.resolved) return false

    // Severity filter
    if (severityFilter !== 'all' && crash.severity !== severityFilter) return false

    // Search filter
    if (searchTerm && !crash.message.toLowerCase().includes(searchTerm.toLowerCase())) return false

    return true
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'error': return <Bug className="w-4 h-4 text-orange-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading crash reports...</p>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold text-gray-900">Crash Details</h1>
                <p className="text-gray-600">Error logs and crash reports</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={exportCrashes} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'unresolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unresolved')}
                  >
                    Unresolved
                  </Button>
                  <Button
                    variant={filter === 'resolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('resolved')}
                  >
                    Resolved
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Severity:</span>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search crashes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Crash List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bug className="w-5 h-5 mr-2" />
                    Crash Reports ({filteredCrashes.length})
                  </div>
                </CardTitle>
                <CardDescription>Error logs and system crashes</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCrashes.length === 0 ? (
                  <div className="text-center py-8">
                    <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No crash reports found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCrashes.map((crash) => (
                      <div
                        key={crash.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCrash?.id === crash.id
                            ? 'border-blue-500 bg-blue-50'
                            : crash.resolved
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                        onClick={() => setSelectedCrash(crash)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getTypeIcon(crash.type)}
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {crash.message}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(crash.severity)}`}>
                                {crash.severity}
                              </span>
                              {crash.resolved && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {crash.url}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(crash.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FileText className="w-3 h-3" />
                                <span>{crash.type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!crash.resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsResolved(crash.id)
                                }}
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteCrash(crash.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Crash Detail */}
          <div className="lg:col-span-1">
            {selectedCrash ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Crash Details</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedCrash.severity)}`}>
                      {selectedCrash.severity}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Error Message</label>
                    <p className="text-gray-900 mt-1">{selectedCrash.message}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">URL</label>
                    <p className="text-gray-900 mt-1 break-all">{selectedCrash.url}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Timestamp</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedCrash.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Agent</label>
                    <p className="text-gray-900 mt-1 text-sm break-all">{selectedCrash.userAgent}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Stack Trace</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">{selectedCrash.stackTrace}</pre>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    {!selectedCrash.resolved && (
                      <Button
                        onClick={() => markAsResolved(selectedCrash.id)}
                        className="flex-1"
                      >
                        Mark as Resolved
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => deleteCrash(selectedCrash.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a crash report to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
