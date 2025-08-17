'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { useAdminData } from '@/components/providers/AdminDataProvider'
import { 
  Users, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Activity, 
  AlertTriangle, 
  Database, 
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Mail,
  User
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalUsers: number
  totalClasses: number
  totalAssignments: number
  totalQuizzes: number
  totalNotes: number
  unreadMessages: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastBackup: string
  activeUsers: number
  totalEnrollments: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { adminData, updateDashboardStats } = useAdminData()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    totalNotes: 0,
    unreadMessages: 0,
    systemHealth: 'healthy',
    lastBackup: 'Never',
    activeUsers: 0,
    totalEnrollments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Check if we have cached stats
      if (adminData.dashboardStats) {
        setStats(adminData.dashboardStats)
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        updateDashboardStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const createTestBackup = async () => {
    try {
      const response = await fetch('/api/admin/backup/test', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        toast.success('Test backup created successfully')
        fetchDashboardStats() // Refresh stats
      } else {
        toast.error('Failed to create test backup')
      }
    } catch (error) {
      console.error('Error creating test backup:', error)
      toast.error('Failed to create test backup')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System overview and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getSystemHealthIcon(stats.systemHealth)}
                <span className={`font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                  System: {stats.systemHealth}
                </span>
              </div>
              <Button asChild variant="outline">
                <Link href="/admin/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button 
                onClick={createTestBackup}
                variant="outline"
                size="sm"
              >
                <Database className="w-4 h-4 mr-2" />
                Test Backup
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/messages">View Messages</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.systemHealth}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/performance">View Reports</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Backup</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lastBackup}</p>
                </div>
                <Database className="w-8 h-8 text-purple-600" />
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/backup">Manage Backup</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/users">View Users</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Platform Statistics
              </CardTitle>
              <CardDescription>Overview of platform usage and content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Total Users</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Total Classes</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalClasses}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Total Assignments</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Total Quizzes</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">Total Notes</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalNotes}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-teal-600" />
                    <span className="font-medium">Total Enrollments</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                System Status
              </CardTitle>
              <CardDescription>Current system health and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      stats.systemHealth === 'healthy' ? 'bg-green-500' :
                      stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">System Status</span>
                  </div>
                  <span className={`font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                    {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Last Backup</span>
                  </div>
                  <span className="text-sm text-gray-600">{stats.lastBackup}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Active Users</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Unread Messages</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Messages
              </CardTitle>
              <CardDescription>View and manage contact form submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/messages">
                  Manage Messages
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Management
              </CardTitle>
              <CardDescription>Test and manage email functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/email">
                  Manage Email
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Performance Reports
              </CardTitle>
              <CardDescription>System performance and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/performance">
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Crash Details
              </CardTitle>
              <CardDescription>Error logs and crash reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/crashes">
                  View Crashes
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Backup Management
              </CardTitle>
              <CardDescription>Database backup and restore</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/backup">
                  Manage Backup
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Management
              </CardTitle>
              <CardDescription>Manage users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/users">
                  Manage Users
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                System Settings
              </CardTitle>
              <CardDescription>Configure system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/settings">
                  Configure System
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
