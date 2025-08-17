'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface AdminData {
  dashboardStats: any
  messages: any[]
  users: any[]
  performanceData: any
  backupData: any
  settings: any
}

interface AdminDataContextType {
  adminData: AdminData
  updateDashboardStats: (stats: any) => void
  updateMessages: (messages: any[]) => void
  updateUsers: (users: any[]) => void
  updatePerformanceData: (data: any) => void
  updateBackupData: (data: any) => void
  updateSettings: (settings: any) => void
  clearData: () => void
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [adminData, setAdminData] = useState<AdminData>({
    dashboardStats: null,
    messages: [],
    users: [],
    performanceData: null,
    backupData: null,
    settings: null
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('adminData')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setAdminData(parsed)
      } catch (error) {
        console.error('Error parsing saved admin data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminData', JSON.stringify(adminData))
  }, [adminData])

  const updateDashboardStats = (stats: any) => {
    setAdminData(prev => ({ ...prev, dashboardStats: stats }))
  }

  const updateMessages = (messages: any[]) => {
    setAdminData(prev => ({ ...prev, messages }))
  }

  const updateUsers = (users: any[]) => {
    setAdminData(prev => ({ ...prev, users }))
  }

  const updatePerformanceData = (data: any) => {
    setAdminData(prev => ({ ...prev, performanceData: data }))
  }

  const updateBackupData = (data: any) => {
    setAdminData(prev => ({ ...prev, backupData: data }))
  }

  const updateSettings = (settings: any) => {
    setAdminData(prev => ({ ...prev, settings }))
  }

  const clearData = () => {
    setAdminData({
      dashboardStats: null,
      messages: [],
      users: [],
      performanceData: null,
      backupData: null,
      settings: null
    })
    localStorage.removeItem('adminData')
  }

  const value = {
    adminData,
    updateDashboardStats,
    updateMessages,
    updateUsers,
    updatePerformanceData,
    updateBackupData,
    updateSettings,
    clearData
  }

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData() {
  const context = useContext(AdminDataContext)
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider')
  }
  return context
}
