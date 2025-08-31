'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  BookOpen, 
  Code, 
  FileText, 
  Users, 
  BarChart3, 
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  Calendar,
  GraduationCap,
  Eye,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import BasicClassCard from '@/components/classes/BasicClassCard'

interface EnrolledClass {
  id: string
  class: {
    id: string
    name: string
    code: string
    description?: string
    isPrivate: boolean
    isArchived: boolean
    archivedAt?: string
    createdAt: string
    professor: {
      id: string
      name: string
      email: string
      avatar?: string
      teacherProfile?: {
        university?: string
        department?: string
      }
    }
    _count: {
      enrollments: number
      notes: number
      quizzes: number
      assignments: number
    }
  }
  enrolledAt: string
}

interface QuizPerformance {
  id: string
  title: string
  class: string
  score: number
  date: string
}

interface AssignmentSubmission {
  id: string
  title: string
  class: string
  grade: number | null
  submittedAt: string
}

interface AttendanceStats {
  totalSessions: number
  present: number
  absent: number
  late: number
  excused: number
  notMarked: number
  attendanceRate: string
  sessions: Array<{
    id: string
    date: string
    title: string
    status: string
    markedAt?: string
  }>
}

export function StudentDashboard() {
  const { user } = useAuth()
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    enrolledClasses: 0,
    completedQuizzes: 0,
    totalQuizzes: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    averageScore: 0,
    studyStreak: 0,
    upcomingDeadlines: 0
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformance[]>([])
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)

  useEffect(() => {
    if (user) {
      loadEnrolledClasses()
      loadStudentStats()
    }
  }, [user])

  useEffect(() => {
    if (enrolledClasses.length > 0) {
      loadQuizPerformance()
      loadAssignmentSubmissions()
      loadAttendanceStats()
    }
  }, [enrolledClasses])

  const loadEnrolledClasses = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/enrollments?studentId=${user.id}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setEnrolledClasses(data.enrollments || [])
        // Load detailed stats from the stats API
        loadStudentStats()
      }
    } catch (error) {
      console.error('Error loading enrolled classes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStudentStats = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/student/stats', {
        headers: {
          'x-user-id': user.id,
        },
        cache: 'no-store' // Force fresh data
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          enrolledClasses: data.enrolledClasses,
          completedQuizzes: data.completedQuizzes,
          totalQuizzes: data.totalQuizzes,
          completedAssignments: data.completedAssignments,
          totalAssignments: data.totalAssignments,
          averageScore: data.averageScore,
          studyStreak: data.studyStreak,
          upcomingDeadlines: data.upcomingDeadlines
        })
        setRecentActivity(data.recentActivity || [])
        setUpcomingDeadlines(data.upcomingDeadlinesList || [])
      }
    } catch (error) {
      console.error('Error loading student stats:', error)
    }
  }

  const loadQuizPerformance = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/student/quiz-performance', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setQuizPerformance(data.quizzes || [])
      }
    } catch (error) {
        console.error('Error loading quiz performance:', error)
    }
  }

  const loadAssignmentSubmissions = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/student/assignments', {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAssignmentSubmissions(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignment submissions:', error)
    }
  }

  const loadAttendanceStats = async () => {
    if (!user || enrolledClasses.length === 0) return

    try {
      // Load attendance stats for the first enrolled class (or combine all classes)
      const classId = enrolledClasses[0].class.id
      const response = await fetch(`/api/attendance/analytics?classId=${classId}`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAttendanceStats(data.analytics)
      }
    } catch (error) {
      console.error('Error loading attendance stats:', error)
    }
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Keep up the great work! You're on a {stats.studyStreak}-day study streak.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Enrolled Classes</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.enrolledClasses}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active classes</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Quiz Progress</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.completedQuizzes}/{stats.totalQuizzes}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)}% completed</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Code className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.averageScore}%</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Across all quizzes</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Upcoming Deadlines</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.upcomingDeadlines}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Next 7 days</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">My Classes</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your enrolled classes and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : enrolledClasses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-medium mb-2">No enrolled classes yet</h3>
                    <p className="mb-4">Browse and enroll in classes to start your learning journey.</p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Link href="/classes">
                        Browse Classes
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledClasses.map((enrollment) => (
                    <BasicClassCard 
                      key={enrollment.id} 
                      classData={enrollment.class}
                    />
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/classes">Browse More Classes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Upcoming Deadlines</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Due in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {deadline.type === 'quiz' && <Code className="h-4 w-4 text-blue-500 mt-1" />}
                      {deadline.type === 'assignment' && <FileText className="h-4 w-4 text-green-500 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={deadline.type === 'quiz' 
                            ? `/dashboard/quizzes/${deadline.quizId}/take` 
                            : `/dashboard/assignments/${deadline.assignmentId}`
                          }
                          className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          {deadline.title}
                        </Link>
                        {deadline.completed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {deadline.class} • Due {deadline.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Link href="/dashboard/calendar">View Calendar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your latest learning activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === 'quiz' && <Code className="h-4 w-4 text-blue-500" />}
                  {activity.type === 'assignment' && <FileText className="h-4 w-4 text-green-500" />}
                  {activity.type === 'note' && <BookOpen className="h-4 w-4 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.class} • {activity.time}
                    {activity.score && ` • Score: ${activity.score}%`}
                  </p>
                </div>
                {activity.type === 'quiz' && activity.score && (
                  <div className="flex-shrink-0">
                    <span className={`text-sm font-medium ${
                      activity.score >= 80 ? 'text-green-600 dark:text-green-400' : 
                      activity.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {activity.score}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance and Attendance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quiz Performance */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <Code className="w-5 h-5 mr-2 text-blue-500" />
              Quiz Performance
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Recent quiz attempts and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {quizPerformance.length > 0 ? (
                quizPerformance.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                        {quiz.title}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {quiz.class} • {quiz.date}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        quiz.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        quiz.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {quiz.score}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Code className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No quiz attempts yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Submissions */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-500" />
              Assignment Submissions
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Recent submissions and grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {assignmentSubmissions.length > 0 ? (
                assignmentSubmissions.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                        {assignment.title}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {assignment.class} • {assignment.submittedAt}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {assignment.grade !== null ? (
                        <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {assignment.grade} pts
                        </span>
                      ) : (
                        <span className="text-sm font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No submissions yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-purple-500" />
              Attendance Stats
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your attendance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceStats ? (
              <div className="space-y-4">
                {/* Attendance Rate */}
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {attendanceStats.attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
                </div>

                {/* Attendance Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {attendanceStats.present}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Present</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {attendanceStats.absent}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Absent</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {attendanceStats.late}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Late</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {attendanceStats.excused}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Excused</div>
                  </div>
                </div>

                {/* View Details Button */}
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <Link href={`/dashboard/attendance/student?classId=${enrolledClasses[0]?.class.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No attendance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
} 