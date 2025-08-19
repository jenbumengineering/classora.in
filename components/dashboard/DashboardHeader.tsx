'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { useUnreadContent } from '@/hooks/useUnreadContent'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/lib/avatar'

interface DashboardHeaderProps {
  user: any
  onMenuClick: () => void
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const { logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, manualRefresh } = useNotifications()
  const { unreadCounts, markAllContentAsViewed } = useUnreadContent()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNotificationClick = (notificationId: string) => {
    markAsRead([notificationId])
  }

  const handleNotificationToggle = () => {
    const newState = !notificationMenuOpen
    setNotificationMenuOpen(newState)
    
    // Refresh notifications when opening the dropdown
    if (newState) {
      manualRefresh()
    }
  }

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen)
  }

  const handleMarkAllAsRead = async () => {
    // Mark notifications as read
    await markAllAsRead()
    
    // For students, also mark unread content as read
    if (user?.role === 'STUDENT' && unreadCounts.totalUnread > 0) {
      await markAllContentAsViewed()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return '📋'
      case 'quiz':
        return '🧪'
      case 'announcement':
        return '📢'
      case 'assignment_graded':
        return '✅'
      case 'new_note':
        return '📝'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu and search */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search classes, notes, quizzes..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={handleNotificationToggle}
            >
              <Bell className="h-5 w-5" />
              {(unreadCount > 0 || (user?.role === 'STUDENT' && unreadCounts.totalUnread > 0)) && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                  {user?.role === 'STUDENT' 
                    ? (unreadCount + unreadCounts.totalUnread > 99 ? '99+' : unreadCount + unreadCounts.totalUnread)
                    : (unreadCount > 99 ? '99+' : unreadCount)
                  }
                </span>
              )}
            </Button>

            {/* Notification Dropdown */}
            {notificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                  {(unreadCount > 0 || (user?.role === 'STUDENT' && unreadCounts.totalUnread > 0)) && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                {notifications.length === 0 && (!user || user.role !== 'STUDENT' || unreadCounts.totalUnread === 0) ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {/* Show actual notifications */}
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 ${
                          notification.isRead 
                            ? 'border-transparent bg-gray-50 dark:bg-gray-700' 
                            : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        }`}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show unread content summary for students */}
                    {user?.role === 'STUDENT' && unreadCounts.totalUnread > 0 && (
                      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">📚</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              New content available
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {unreadCounts.unreadAssignments > 0 && `${unreadCounts.unreadAssignments} new assignment${unreadCounts.unreadAssignments > 1 ? 's' : ''}`}
                              {unreadCounts.unreadAssignments > 0 && unreadCounts.unreadQuizzes > 0 && ', '}
                              {unreadCounts.unreadQuizzes > 0 && `${unreadCounts.unreadQuizzes} new quiz${unreadCounts.unreadQuizzes > 1 ? 'es' : ''}`}
                              {((unreadCounts.unreadAssignments > 0 || unreadCounts.unreadQuizzes > 0) && unreadCounts.unreadNotes > 0) && ', '}
                              {unreadCounts.unreadNotes > 0 && `${unreadCounts.unreadNotes} new note${unreadCounts.unreadNotes > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              Check your dashboard for details
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUserMenuToggle}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Avatar 
                src={user?.avatar} 
                alt={user?.name || 'User'} 
                size="sm"
              />
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      src={user?.avatar} 
                      alt={user?.name || 'User'} 
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                </div>
                
                <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
                
                <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 