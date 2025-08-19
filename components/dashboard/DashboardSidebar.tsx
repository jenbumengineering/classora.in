'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useSettings } from '@/components/providers/SettingsProvider'
import {
  X, Home, BookOpen, FileText, Users, BarChart3, Settings, Calendar, GraduationCap, User, Plus, Target,
  Code, ChevronLeft, ChevronRight
} from 'lucide-react'

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({ 
  isOpen, 
  onClose, 
  userRole, 
  isCollapsed = false, 
  onToggleCollapse 
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const { settings } = useSettings()
  const siteName = settings?.siteName || 'Classora.in'

  const professorNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/classes', label: 'Classes', icon: GraduationCap },
    { href: '/dashboard/notes', label: 'Notes', icon: BookOpen },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText },
    { href: '/dashboard/quizzes', label: 'Quizzes', icon: Code },
    { href: '/dashboard/practice', label: 'Practice', icon: Target },
    { href: '/dashboard/students', label: 'Students', icon: Users },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/classes', label: 'Classes', icon: GraduationCap },
    { href: '/dashboard/notes', label: 'Notes', icon: BookOpen },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText },
    { href: '/dashboard/quizzes', label: 'Quizzes', icon: Code },
    { href: '/dashboard/practice', label: 'Practice', icon: Target },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const navItems = userRole === 'PROFESSOR' ? professorNavItems : studentNavItems

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {!isCollapsed && (
              <div className="flex items-center">
                <Logo size="sm" variant="full" theme="light" className="dark:hidden" />
                <Logo size="sm" variant="full" theme="dark" className="hidden dark:flex" />
              </div>
            )}
            <div className="flex items-center space-x-2">
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="hidden md:flex p-1"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive(item.href) ? 'primary' : 'ghost'}
                  className={`w-full justify-start ${isActive(item.href) 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${isCollapsed ? 'px-2' : 'px-4'}`}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                </Button>
              )
            })}
          </nav>

          {/* Quick Actions for Professors */}
          {userRole === 'PROFESSOR' && !isCollapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/classes" className="flex items-center w-full">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Create Class</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/dashboard/notes/new" className="flex items-center w-full">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>New Note</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full flex items-center justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/dashboard/quizzes/new" className="flex items-center w-full">
                    <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>New Quiz</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!isCollapsed && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>© 2025 {siteName}</p>
                <p className="mt-1">Educational Platform</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 