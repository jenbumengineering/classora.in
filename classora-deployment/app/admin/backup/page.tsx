'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { useAdminData } from '@/components/providers/AdminDataProvider'
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileText,
  HardDrive,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface BackupInfo {
  id: string
  name: string
  size: string
  createdAt: string
  type: 'manual' | 'automatic'
  status: 'completed' | 'in_progress' | 'failed'
  description: string
}

interface BackupSettings {
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  retentionDays: number
  lastBackup: string
  nextBackup: string
  backupLocation: string
}

export default function AdminBackup() {
  const { user } = useAuth()
  const { adminData, updateBackupData } = useAdminData()
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    lastBackup: 'Never',
    nextBackup: 'Not scheduled',
    backupLocation: '/backups'
  })
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBackupData()
  }, [])

  const fetchBackupData = async (forceRefresh = false) => {
    try {
      // Check if we have cached backup data and not forcing refresh
      if (adminData.backupData && !forceRefresh) {
        setBackups(adminData.backupData.backups || [])
        setSettings(adminData.backupData.settings)
        setLoading(false)
        return
      }

      const [backupsResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/backup', {
          headers: {
            'x-user-id': user?.id || ''
          },
          cache: 'no-store' // Force fresh data
        }),
        fetch('/api/admin/backup/settings', {
          headers: {
            'x-user-id': user?.id || ''
          },
          cache: 'no-store' // Force fresh data
        })
      ])
      
      let backupsData = []
      let settingsData = settings
      let hasErrors = false

      if (backupsResponse.ok) {
        const data = await backupsResponse.json()
        backupsData = data.backups || []
        setBackups(backupsData)
        console.log('Backups loaded:', backupsData.length)
      } else {
        console.error('Backups response error:', await backupsResponse.text())
        hasErrors = true
      }
      
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        settingsData = data.settings
        setSettings(settingsData)
      } else {
        console.error('Settings response error:', await settingsResponse.text())
        hasErrors = true
      }

      // Cache the backup data
      updateBackupData({
        backups: backupsData,
        settings: settingsData
      })

      // Only show error toast if there were actual errors
      if (hasErrors) {
        toast.error('Some backup information failed to load')
      }
    } catch (error) {
      console.error('Error fetching backup data:', error)
      toast.error('Failed to load backup information')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setCreatingBackup(true)
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        toast.success('Manual backup created successfully')
        fetchBackupData(true) // Force refresh the list
      } else {
        const errorText = await response.text()
        console.error('Backup creation error:', errorText)
        toast.error('Failed to create backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Failed to create backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  const createAutomaticBackup = async () => {
    setCreatingBackup(true)
    try {
      const response = await fetch('/api/admin/backup/auto', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        toast.success('Automatic backup created successfully')
        fetchBackupData(true) // Force refresh the list
      } else {
        const errorText = await response.text()
        console.error('Automatic backup creation error:', errorText)
        toast.error('Failed to create automatic backup')
      }
    } catch (error) {
      console.error('Error creating automatic backup:', error)
      toast.error('Failed to create automatic backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backup/${backupId}/download`, {
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupId}.sql`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Backup downloaded successfully')
      } else {
        toast.error('Failed to download backup')
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Failed to download backup')
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return

    try {
      const response = await fetch(`/api/admin/backup/${backupId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        setBackups(prev => prev.filter(backup => backup.id !== backupId))
        toast.success('Backup deleted successfully')
      } else {
        toast.error('Failed to delete backup')
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error('Failed to delete backup')
    }
  }

  const updateSettings = async (newSettings: Partial<BackupSettings>) => {
    try {
      const response = await fetch('/api/admin/backup/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(newSettings)
      })
      if (response.ok) {
        setSettings(prev => ({ ...prev, ...newSettings }))
        toast.success('Backup settings updated')
      } else {
        const errorText = await response.text()
        console.error('Settings update error:', errorText)
        toast.error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
  }

  const restoreDatabase = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file')
      return
    }

    if (!selectedFile.name.endsWith('.sql')) {
      toast.error('Please select a valid .sql backup file')
      return
    }

    if (!confirm('Are you sure you want to restore the database? This will overwrite all current data.')) {
      return
    }

    setRestoring(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || ''
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || 'Database restored successfully')
        setSelectedFile(null)
        // Reset file input
        const fileInput = document.getElementById('restore-file-input') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to restore database')
      }
    } catch (error) {
      console.error('Error restoring database:', error)
      toast.error('Failed to restore database')
    } finally {
      setRestoring(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading backup information...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
                <p className="text-gray-600">Database backup and restore</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => fetchBackupData(true)}
                disabled={loading}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={createBackup} 
                disabled={creatingBackup}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creatingBackup ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                {creatingBackup ? 'Creating...' : 'Create Manual Backup'}
              </Button>
              
              <Button 
                onClick={createAutomaticBackup} 
                disabled={creatingBackup}
                className="bg-green-600 hover:bg-green-700"
              >
                {creatingBackup ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                {creatingBackup ? 'Creating...' : 'Create Automatic Backup'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Backup Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Backup Settings
            </CardTitle>
            <CardDescription>Configure automatic backup settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Backup</label>
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => updateSettings({ autoBackup: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enable automatic backups</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => updateSettings({ backupFrequency: e.target.value as any })}
                  className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Retention (Days)</label>
                <input
                  type="number"
                  value={settings.retentionDays}
                  onChange={(e) => updateSettings({ retentionDays: parseInt(e.target.value) })}
                  className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="365"
                />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Last Backup</p>
                <p className="font-medium text-gray-900">{settings.lastBackup}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Next Backup</p>
                <p className="font-medium text-gray-900">{settings.nextBackup}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Backup Location</p>
                <p className="font-medium text-gray-900">{settings.backupLocation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Backup History ({backups.length})
            </CardTitle>
            <CardDescription>Recent database backups</CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No backups found</p>
                <p className="text-sm text-gray-500 mt-2">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(backup.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(backup.status)}`}>
                          {backup.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{backup.name}</h3>
                        <p className="text-sm text-gray-600">{backup.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>{backup.size}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(backup.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HardDrive className="w-3 h-3" />
                            <span>{backup.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteBackup(backup.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Restore Database
            </CardTitle>
            <CardDescription>Restore database from a backup file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Warning</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Restoring a database will overwrite all current data. Make sure to create a backup before proceeding.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  id="restore-file-input"
                  type="file"
                  accept=".sql"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Button 
                  variant="outline" 
                  onClick={restoreDatabase}
                  disabled={!selectedFile || restoring}
                >
                  {restoring ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {restoring ? 'Restoring...' : 'Restore'}
                </Button>
              </div>
              {selectedFile && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
