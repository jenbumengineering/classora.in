'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PerformanceCharts } from '@/components/admin/PerformanceCharts'
import { useAuth } from '@/components/providers/AuthProvider'
import { useAdminData } from '@/components/providers/AdminDataProvider'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  ArrowLeft,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface PerformanceMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
  activeConnections: number
  responseTime: number
  errorRate: number
  uptime: string
  lastUpdated: string
}

interface PerformanceDataPoint {
  timestamp: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
  activeConnections: number
  responseTime: number
  errorRate: number
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
}

export default function AdminPerformance() {
  const { user } = useAuth()
  const { adminData, updatePerformanceData } = useAdminData()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    responseTime: 0,
    errorRate: 0,
    uptime: '0 days',
    lastUpdated: new Date().toISOString()
  })
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    issues: [],
    recommendations: []
  })
  const [historicalData, setHistoricalData] = useState<PerformanceDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
    const interval = setInterval(fetchPerformanceData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPerformanceData = async () => {
    try {
      // Check if we have cached performance data
      if (adminData.performanceData) {
        setMetrics(adminData.performanceData.metrics)
        setHealth(adminData.performanceData.health)
        setHistoricalData(adminData.performanceData.historicalData || [])
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/performance', {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setHealth(data.health)
        setHistoricalData(data.historicalData || [])
        updatePerformanceData(data)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100'
      case 'warning': return 'bg-yellow-100'
      case 'critical': return 'bg-red-100'
      default: return 'bg-gray-100'
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600'
    if (usage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
                <p className="text-gray-600">System performance and health monitoring</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${getStatusBgColor(health.status)}`}>
              <span className={`font-medium ${getStatusColor(health.status)}`}>
                System: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* System Health Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              System Health Overview
            </CardTitle>
            <CardDescription>Current system status and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Current Issues</h3>
                {health.issues.length === 0 ? (
                  <p className="text-green-600">No issues detected</p>
                ) : (
                  <ul className="space-y-2">
                    {health.issues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-3">Recommendations</h3>
                {health.recommendations.length === 0 ? (
                  <p className="text-gray-600">System is running optimally</p>
                ) : (
                  <ul className="space-y-2">
                    {health.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                  <p className={`text-2xl font-bold ${getUsageColor(metrics.cpuUsage)}`}>
                    {metrics.cpuUsage}%
                  </p>
                </div>
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className={`text-2xl font-bold ${getUsageColor(metrics.memoryUsage)}`}>
                    {metrics.memoryUsage}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disk Usage</p>
                  <p className={`text-2xl font-bold ${getUsageColor(metrics.diskUsage)}`}>
                    {metrics.diskUsage}%
                  </p>
                </div>
                <HardDrive className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Network Latency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.networkLatency}ms
                  </p>
                </div>
                <Wifi className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Connection Metrics
              </CardTitle>
              <CardDescription>Network and connection statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Active Connections</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{metrics.activeConnections}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Response Time</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{metrics.responseTime}ms</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Error Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{metrics.errorRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                System Information
              </CardTitle>
              <CardDescription>System uptime and last update</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Uptime</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{metrics.uptime}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Last Updated</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(metrics.lastUpdated).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Auto Refresh</span>
                  </div>
                  <span className="text-sm text-gray-600">Every 30 seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        {historicalData.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Historical performance data and trends over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceCharts data={historicalData} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
