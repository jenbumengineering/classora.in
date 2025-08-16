'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthProvider'

interface Notification {
  id: string
  title: string
  message: string
  type: 'assignment' | 'quiz' | 'announcement' | 'general' | 'system' | 'assignment_graded' | 'new_note'
  isRead: boolean
  data?: string
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  loadNotifications: () => Promise<void>
  markAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshCount: () => Promise<void>
  manualRefresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  const loadNotifications = async (limit?: number) => {
    if (!user) return

    setLoading(true)
    try {
      const url = limit ? `/api/notifications?limit=${limit}` : '/api/notifications'
      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } else {
        console.error('Failed to load notifications')
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
        
        // Update notifications to mark them as read
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
        
        // Mark all notifications as read
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        // Remove the notification from the list and update count locally
        setNotifications(prev => {
          const updated = prev.filter(notification => notification.id !== notificationId)
          // Update unread count locally if the deleted notification was unread
          const deletedNotification = prev.find(n => n.id === notificationId)
          if (deletedNotification && !deletedNotification.isRead) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1))
          }
          return updated
        })
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const refreshCount = async () => {
    if (!user || isPolling) return

    // Real-time updates - refresh every 30 seconds for active users
    const now = Date.now()
    if (now - lastRefresh < 30000) return

    setIsPolling(true)
    try {
      const response = await fetch('/api/notifications?limit=0', {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
        setLastRefresh(now)
      }
    } catch (error) {
      console.error('Error refreshing notification count:', error)
    } finally {
      setIsPolling(false)
    }
  }

  const manualRefresh = async () => {
    if (!user) return
    
    setIsPolling(true)
    try {
      // Load both notifications and count
      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
        setLastRefresh(Date.now())
      }
    } catch (error) {
      console.error('Error manually refreshing notifications:', error)
    } finally {
      setIsPolling(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadNotifications(10) // Load only 10 for the dropdown
      
      // Set up polling to refresh notification count every 30 seconds for real-time updates
      const interval = setInterval(refreshCount, 30000)
      
      return () => clearInterval(interval)
    } else {
      setNotifications([])
      setUnreadCount(0)
      setLastRefresh(0)
      setIsPolling(false)
    }
  }, [user])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshCount,
    manualRefresh
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
