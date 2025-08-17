'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useSettings } from '@/components/providers/SettingsProvider'
import {
  X, Home, BookOpen, FileText, Users, BarChart3, Settings, Calendar, GraduationCap, User, Plus, Target,
  Code
} from 'lucide-react'

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
}

export function DashboardSidebar({ isOpen, onClose, userRole }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { settings } = useSettings()
  const siteName = settings?.siteName || 'Classora.in'

  const professorNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/classes', label: 'Classes', icon: GraduationCap },
    { href: '/dashboard/notes', label: 'Notes', icon: BookOpen },
    { href: '/dashboard/assignments', label: 'Assignments', icon: FileText },
    { href: '/dashboard/quizzes', label: 'Quizzes', icon: Code },
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Logo size="sm" variant="full" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className={`w-full justify-start ${isActive(item.href) ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions for Professors */}
          {userRole === 'PROFESSOR' && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/classes">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/dashboard/notes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/dashboard/quizzes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Quiz
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p>© 2025 {siteName}</p>
              <p className="mt-1">Educational Platform</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 