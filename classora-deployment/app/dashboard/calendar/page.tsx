'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'quiz':
        return <Code className="h-4 w-4 text-green-600" />
      case 'note':
        return <BookOpen className="h-4 w-4 text-purple-600" />
      case 'holiday':
        return <Calendar className="h-4 w-4 text-red-600" />
      case 'academic':
        return <BookOpen className="h-4 w-4 text-orange-600" />
      case 'todo':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'class':
        return <Calendar className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'border-l-blue-500 bg-blue-50'
      case 'quiz':
        return 'border-l-green-500 bg-green-50'
      case 'note':
        return 'border-l-purple-500 bg-purple-50'
      case 'holiday':
        return 'border-l-red-500 bg-red-50'
      case 'academic':
        return 'border-l-orange-500 bg-orange-50'
      case 'todo':
        return 'border-l-blue-500 bg-blue-50'
      case 'class':
        return 'border-l-orange-500 bg-orange-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role as 'STUDENT' | 'PROFESSOR' || 'STUDENT'}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
                <p className="text-gray-600 mt-2">View and manage your schedule</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/calendar/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar View</CardTitle>
                    <CardDescription>Interactive calendar showing assignments, quizzes, notes, and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CalendarView 
                      events={events} 
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                    <CardDescription>Next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : upcomingEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No upcoming events</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <div 
                            key={event.id} 
                            className={`p-3 rounded-lg border-l-4 ${getEventColor(event.type)}`}
                          >
                            <div className="flex items-start space-x-3">
                              {getEventIcon(event.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {event.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {event.className}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(event.date).toLocaleDateString()}
                                  {event.time && ` at ${event.time}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Assignments Due</span>
                        <span className="text-sm font-medium">{weeklyStats.assignments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quizzes</span>
                        <span className="text-sm font-medium">{weeklyStats.quizzes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Notes Published</span>
                        <span className="text-sm font-medium">{weeklyStats.notes}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Holidays</span>
                        <span className="text-sm font-medium">{weeklyStats.holidays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Academic Events</span>
                        <span className="text-sm font-medium">{weeklyStats.academic}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Todos</span>
                        <span className="text-sm font-medium">{weeklyStats.todos}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Calendar View Component
function CalendarView({ 
  events, 
  selectedDate, 
  onDateSelect 
}: { 
  events: CalendarEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
  const days = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>)
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dayEvents = getEventsForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const isSelected = date.toDateString() === selectedDate.toDateString()

    days.push(
      <div 
        key={day}
        className={`h-24 border border-gray-200 p-1 cursor-pointer transition-colors ${
          isToday ? 'bg-blue-50 border-blue-300' : 
          isSelected ? 'bg-gray-100 border-gray-400' : 
          'hover:bg-gray-50'
        }`}
        onClick={() => onDateSelect(date)}
      >
        <div className="text-sm font-medium mb-1">{day}</div>
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <div 
              key={event.id}
                             className={`text-xs p-1 rounded truncate ${
                 event.type === 'assignment' ? 'bg-blue-100 text-blue-800' :
                 event.type === 'quiz' ? 'bg-green-100 text-green-800' :
                 event.type === 'note' ? 'bg-purple-100 text-purple-800' :
                 event.type === 'holiday' ? 'bg-red-100 text-red-800' :
                 event.type === 'academic' ? 'bg-orange-100 text-orange-800' :
                 event.type === 'todo' ? 'bg-blue-100 text-blue-800' :
                 'bg-gray-100 text-gray-800'
               }`}
              title={event.title}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-gray-500">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold">{formatDate(currentMonth)}</h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          →
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          <span>Assignments</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>Quizzes</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-100 rounded"></div>
          <span>Notes</span>
        </div>
      </div>
    </div>
  )
}
