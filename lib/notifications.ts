import React from 'react'
import { useSettings } from '@/components/providers/SettingsProvider'
import { useAuth } from '@/components/providers/AuthProvider'

export interface NotificationData {
  title: string
  message: string
  type: 'assignment' | 'quiz' | 'announcement' | 'general' | 'assignment_graded' | 'new_note'
  action?: () => void
}

export class NotificationService {
  private static instance: NotificationService
  private settings: any = null
  private userId: string | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  setSettings(settings: any, userId?: string) {
    this.settings = settings
    if (userId) {
      this.userId = userId
    }
  }

  async showNotification(data: NotificationData) {
    if (!this.settings) return

    const { notifications } = this.settings

    // Check if notifications are enabled for this type
    let shouldShow = false

    switch (data.type) {
      case 'assignment':
        shouldShow = notifications.assignments
        break
      case 'quiz':
        shouldShow = notifications.quizzes
        break
      case 'announcement':
        shouldShow = notifications.announcements
        break
      case 'assignment_graded':
        shouldShow = notifications.assignments
        break
      case 'new_note':
        shouldShow = notifications.announcements
        break
      default:
        shouldShow = true
        break
    }

    if (!shouldShow) return

    // Create notification in database
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId || '',
        },
        body: JSON.stringify({
          title: data.title,
          message: data.message,
          type: data.type
        }),
      })

      if (!response.ok) {
        console.error('Failed to create notification in database')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
    }

    // Show browser notification if push notifications are enabled
    if (notifications.push && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico'
        })
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico'
          })
        }
      }
    }

    // Show toast notification
    const { default: toast } = await import('react-hot-toast')
    toast.success(data.message, {
      duration: 4000
    })
  }

  async showAssignmentNotification(assignmentTitle: string, dueDate?: string) {
    const message = dueDate 
      ? `New assignment: ${assignmentTitle} (Due: ${new Date(dueDate).toLocaleDateString()})`
      : `New assignment: ${assignmentTitle}`

    await this.showNotification({
      title: 'New Assignment',
      message,
      type: 'assignment'
    })
  }

  async showQuizNotification(quizTitle: string, timeLimit?: number) {
    const message = timeLimit 
      ? `New quiz: ${quizTitle} (${timeLimit} minutes)`
      : `New quiz: ${quizTitle}`

    await this.showNotification({
      title: 'New Quiz',
      message,
      type: 'quiz'
    })
  }

  async showAnnouncementNotification(announcementTitle: string) {
    await this.showNotification({
      title: 'New Announcement',
      message: `New announcement: ${announcementTitle}`,
      type: 'announcement'
    })
  }

  async showGeneralNotification(title: string, message: string) {
    await this.showNotification({
      title,
      message,
      type: 'general'
    })
  }

  async showAssignmentGradedNotification(assignmentTitle: string, grade: number) {
    await this.showNotification({
      title: 'Assignment Graded',
      message: `Your assignment "${assignmentTitle}" has been graded: ${grade}%`,
      type: 'assignment_graded'
    })
  }

  async showNewNoteNotification(noteTitle: string, className: string) {
    await this.showNotification({
      title: 'New Note Available',
      message: `New note "${noteTitle}" is available in ${className}`,
      type: 'new_note'
    })
  }
}

// Hook to use notifications with settings
export function useNotifications() {
  const { settings } = useSettings()
  const { user } = useAuth()
  const notificationService = NotificationService.getInstance()

  // Update settings in the service when they change
  React.useEffect(() => {
    if (settings && user) {
      notificationService.setSettings(settings, user.id)
    }
  }, [settings, user])

  return {
    showAssignmentNotification: notificationService.showAssignmentNotification.bind(notificationService),
    showQuizNotification: notificationService.showQuizNotification.bind(notificationService),
    showAnnouncementNotification: notificationService.showAnnouncementNotification.bind(notificationService),
    showGeneralNotification: notificationService.showGeneralNotification.bind(notificationService),
    showAssignmentGradedNotification: notificationService.showAssignmentGradedNotification.bind(notificationService),
    showNewNoteNotification: notificationService.showNewNoteNotification.bind(notificationService)
  }
}
