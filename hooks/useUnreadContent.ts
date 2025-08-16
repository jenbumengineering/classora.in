import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

interface UnreadCounts {
  unreadAssignments: number
  unreadQuizzes: number
  unreadNotes: number
  totalUnread: number
}

export function useUnreadContent() {
  const { user } = useAuth()
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    unreadAssignments: 0,
    unreadQuizzes: 0,
    unreadNotes: 0,
    totalUnread: 0
  })
  const [loading, setLoading] = useState(false)

  const loadUnreadCounts = async () => {
    if (!user || user.role !== 'STUDENT') return

    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/student/unread-counts', {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCounts(data)
      }
    } catch (error) {
      console.error('Error loading unread counts:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAssignmentAsViewed = async (assignmentId: string) => {
    if (!user || user.role !== 'STUDENT') return

    try {
      await fetch(`/api/assignments/${assignmentId}/view`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
      })
      
      // Update local counts
      setUnreadCounts(prev => ({
        ...prev,
        unreadAssignments: Math.max(0, prev.unreadAssignments - 1),
        totalUnread: Math.max(0, prev.totalUnread - 1)
      }))
    } catch (error) {
      console.error('Error marking assignment as viewed:', error)
    }
  }

  const markQuizAsViewed = async (quizId: string) => {
    if (!user || user.role !== 'STUDENT') return

    try {
      await fetch(`/api/quizzes/${quizId}/view`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
      })
      
      // Update local counts
      setUnreadCounts(prev => ({
        ...prev,
        unreadQuizzes: Math.max(0, prev.unreadQuizzes - 1),
        totalUnread: Math.max(0, prev.totalUnread - 1)
      }))
    } catch (error) {
      console.error('Error marking quiz as viewed:', error)
    }
  }

  const markNoteAsViewed = async (noteId: string) => {
    if (!user || user.role !== 'STUDENT') return

    try {
      await fetch(`/api/notes/${noteId}/view`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
      })
      
      // Update local counts
      setUnreadCounts(prev => ({
        ...prev,
        unreadNotes: Math.max(0, prev.unreadNotes - 1),
        totalUnread: Math.max(0, prev.totalUnread - 1)
      }))
    } catch (error) {
      console.error('Error marking note as viewed:', error)
    }
  }

  const markAllContentAsViewed = async () => {
    if (!user || user.role !== 'STUDENT') return

    try {
      await fetch('/api/dashboard/student/mark-all-viewed', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
      })
      
      // Reset all counts to zero
      setUnreadCounts({
        unreadAssignments: 0,
        unreadQuizzes: 0,
        unreadNotes: 0,
        totalUnread: 0
      })
    } catch (error) {
      console.error('Error marking all content as viewed:', error)
    }
  }

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      loadUnreadCounts()
      
      // Refresh counts every 30 seconds
      const interval = setInterval(loadUnreadCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  return {
    unreadCounts,
    loading,
    loadUnreadCounts,
    markAssignmentAsViewed,
    markQuizAsViewed,
    markNoteAsViewed,
    markAllContentAsViewed
  }
}
