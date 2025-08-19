'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Calendar, Plus, BookOpen, Code, FileText, Clock } from 'lucide-react'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  type: 'assignment' | 'quiz' | 'note' | 'holiday' | 'academic' | 'todo'
  date: string
  time?: string
  classId?: string
  className?: string
  description?: string
  status?: string
}

interface WeeklyStats {
  assignments: number
  quizzes: number
  notes: number
  holidays: number
  academic: number
  todos: number
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    assignments: 0,
    quizzes: 0,
    notes: 0,
    holidays: 0,
    academic: 0,
    todos: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  const loadEvents = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/calendar', {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
        setUpcomingEvents(data.upcomingEvents || [])
        setWeeklyStats(data.weeklyStats || { assignments: 0, quizzes: 0, notes: 0 })
      } else {
        console.error('Failed to load calendar events')
      }
    } catch (error) {
      console.error('Error loading calendar events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'quiz':
        return <Code className="h-4 w-4 text-green-500" />
      case 'note':
        return <BookOpen className="h-4 w-4 text-purple-500" />
      case 'holiday':
        return <Calendar className="h-4 w-4 text-red-500" />
      case 'academic':
        return <BookOpen className="h-4 w-4 text-orange-500" />
      case 'todo':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'class':
        return <Calendar className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'PROFESSOR' 
                ? 'Manage your academic schedule and events' 
                : 'Track your assignments, quizzes, and important dates'
              }
            </p>
          </div>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link href="/dashboard/calendar/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Weekly Overview */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">This Week's Overview</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Summary of your academic activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.assignments}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Assignments</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Code className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.quizzes}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Quizzes</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.notes}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Notes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Events */}
            <div>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Upcoming Events</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Next 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(event.date).toLocaleDateString()}
                              {event.time && ` • ${event.time}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
