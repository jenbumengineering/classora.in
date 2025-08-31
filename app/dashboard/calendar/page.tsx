'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Calendar as CalendarIcon, Plus, BookOpen, Code, FileText, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import Link from 'next/link'
import CalendarComponent from 'react-calendar'
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import 'react-calendar/dist/Calendar.css'

interface CalendarEvent {
  id: string
  title: string
  type: 'assignment' | 'quiz' | 'note' | 'holiday' | 'academic' | 'todo' | 'attendance'
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
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([])
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  useEffect(() => {
    // Update selected events when date changes
    const eventsForDate = events.filter(event => 
      isSameDay(new Date(event.date), selectedDate)
    )
    setSelectedEvents(eventsForDate)
  }, [selectedDate, events])

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
        return <CalendarIcon className="h-4 w-4 text-red-500" />
      case 'academic':
        return <BookOpen className="h-4 w-4 text-orange-500" />
      case 'todo':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'class':
        return <CalendarIcon className="h-4 w-4 text-orange-500" />
      case 'attendance':
        return <CalendarIcon className="h-4 w-4 text-indigo-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventBadge = (type: string) => {
    const typeConfig = {
      assignment: { color: 'bg-blue-100 text-blue-800', label: 'Assignment' },
      quiz: { color: 'bg-green-100 text-green-800', label: 'Quiz' },
      note: { color: 'bg-purple-100 text-purple-800', label: 'Note' },
      holiday: { color: 'bg-red-100 text-red-800', label: 'Holiday' },
      academic: { color: 'bg-orange-100 text-orange-800', label: 'Academic' },
      todo: { color: 'bg-blue-100 text-blue-800', label: 'Todo' },
      class: { color: 'bg-orange-100 text-orange-800', label: 'Class' },
      attendance: { color: 'bg-indigo-100 text-indigo-800', label: 'Attendance' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.todo
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const eventsForDate = events.filter(event => 
        isSameDay(new Date(event.date), date)
      )
      
      if (eventsForDate.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {eventsForDate.slice(0, 2).map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: event.type === 'assignment' ? '#3b82f6' :
                                  event.type === 'quiz' ? '#10b981' :
                                  event.type === 'note' ? '#8b5cf6' :
                                  event.type === 'holiday' ? '#ef4444' :
                                  event.type === 'academic' ? '#f97316' :
                                  event.type === 'attendance' ? '#6366f1' :
                                  '#6b7280'
                }}
                title={event.title}
              />
            ))}
            {eventsForDate.length > 2 && (
              <div className="w-2 h-2 rounded-full bg-gray-400" title={`${eventsForDate.length - 2} more events`} />
            )}
          </div>
        )
      }
    }
    return null
  }

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const eventsForDate = events.filter(event => 
        isSameDay(new Date(event.date), date)
      )
      
      if (eventsForDate.length > 0) {
        return 'has-events'
      }
      
      if (isSameDay(date, selectedDate)) {
        return 'selected-date'
      }
    }
    return ''
  }

  const handleDateChange = (value: any, event: React.MouseEvent<HTMLButtonElement>) => {
    if (value && typeof value === 'object' && 'getTime' in value) {
      setSelectedDate(value as Date)
    }
  }

  const getEventsForMonth = () => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    const daysInMonth = eachDayOfInterval({ start, end })
    
    const monthEvents = daysInMonth.map(date => {
      const dayEvents = events.filter(event => isSameDay(new Date(event.date), date))
      return { date, events: dayEvents }
    }).filter(day => day.events.length > 0)
    
    return monthEvents
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/dashboard/calendar/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calendar View */}
          <div className="lg:col-span-2">
            {viewMode === 'calendar' ? (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Calendar View</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {format(selectedDate, 'MMMM yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="calendar-container">
                    <CalendarComponent
                      onChange={handleDateChange}
                      value={selectedDate}
                      tileContent={tileContent}
                      tileClassName={tileClassName}
                      className="custom-calendar"
                    />
                  </div>
                  
                  {/* Selected Date Events */}
                  {selectedEvents.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="space-y-3">
                        {selectedEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getEventIcon(event.type)}
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  {getEventBadge(event.type)}
                                  {event.className && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {event.className}
                                    </span>
                                  )}
                                </div>
                                {event.time && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Time: {event.time}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/dashboard/calendar/events/${event.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // List View
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Events List</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    All events for {format(selectedDate, 'MMMM yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getEventsForMonth().length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No events for this month</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getEventsForMonth().map(({ date, events }) => (
                        <div key={date.toISOString()}>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {format(date, 'EEEE, MMMM d')}
                          </h4>
                          <div className="space-y-2">
                            {events.map((event) => (
                              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {getEventIcon(event.type)}
                                  <div>
                                    <h5 className="font-medium text-gray-900 dark:text-white">{event.title}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {getEventBadge(event.type)}
                                      {event.className && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {event.className}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/dashboard/calendar/events/${event.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Overview */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">This Week's Overview</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Summary of your academic activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <CalendarIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.academic}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
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
                    <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
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
                            {format(new Date(event.date), 'MMM d')}
                            {event.time && ` • ${event.time}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Types Legend */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Assignments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quizzes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Notes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Holidays</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Academic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Attendance</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-calendar {
          width: 100%;
          border: none;
          background: transparent;
        }
        
        .custom-calendar .react-calendar__tile {
          padding: 8px;
          height: 80px;
          position: relative;
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .custom-calendar .react-calendar__tile:hover {
          background: #f9fafb;
        }
        
        .custom-calendar .react-calendar__tile--active {
          background: #f97316 !important;
          color: white;
        }
        
        .custom-calendar .react-calendar__tile--now {
          background: #fef3c7;
        }
        
        .custom-calendar .react-calendar__navigation button {
          background: transparent;
          border: none;
          padding: 8px 12px;
          font-weight: 600;
        }
        
        .custom-calendar .react-calendar__navigation button:hover {
          background: #f3f4f6;
          border-radius: 6px;
        }
        
        .custom-calendar .react-calendar__month-view__weekdays {
          background: #f9fafb;
          padding: 8px 0;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        
        .custom-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 8px;
          text-align: center;
        }
        
        .custom-calendar .react-calendar__tile--hasEvents {
          background: #f0f9ff;
        }
        
        .custom-calendar .react-calendar__tile--selected {
          background: #f97316 !important;
          color: white;
        }
        
        .dark .custom-calendar .react-calendar__tile {
          background: #374151;
          border-color: #4b5563;
          color: white;
        }
        
        .dark .custom-calendar .react-calendar__tile:hover {
          background: #4b5563;
        }
        
        .dark .custom-calendar .react-calendar__month-view__weekdays {
          background: #374151;
          color: white;
        }
        
        .dark .custom-calendar .react-calendar__tile--hasEvents {
          background: #1e3a8a;
        }
      `}</style>
    </DashboardLayout>
  )
}
