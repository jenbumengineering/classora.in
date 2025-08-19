'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { Lock, Archive, Eye, Users, User } from 'lucide-react'
import { Avatar } from '@/lib/avatar'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface BasicClassCardProps {
  classData: {
    id: string
    name: string
    code: string
    description?: string
    isPrivate: boolean
    isArchived: boolean
    archivedAt?: string
    gradientColor?: string
    imageUrl?: string
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
  onEnroll?: (classId: string) => void
  isEnrolled?: boolean
  onUpdate?: () => void
}

export default function BasicClassCard({ classData, onEnroll, isEnrolled, onUpdate }: BasicClassCardProps) {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  // Use the stored gradient color or fallback to default
  const selectedGradient = classData.gradientColor || 'from-gray-900 to-black'

  const handleArchiveToggle = async () => {
    if (!user || user.role !== 'PROFESSOR') return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/classes/${classData.id}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ isArchived: !classData.isArchived }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update archive status')
      }

      toast.success(classData.isArchived ? 'Class unarchived successfully' : 'Class archived successfully')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating archive status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update archive status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrivacyToggle = async () => {
    if (!user || user.role !== 'PROFESSOR') return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/classes/${classData.id}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ isPrivate: !classData.isPrivate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update privacy status')
      }

      toast.success(classData.isPrivate ? 'Class is now public' : 'Class is now private')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating privacy status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update privacy status')
    } finally {
      setIsUpdating(false)
    }
  }

  const isProfessor = user?.role === 'PROFESSOR' && user?.id === classData.professor.id

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl">
      {/* Image Section */}
      <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-700 dark:to-gray-800 relative">
        {classData.imageUrl ? (
          <img 
            src={classData.imageUrl} 
            alt={classData.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-400 dark:text-gray-500 mb-2">
                {classData.code}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No image uploaded
              </div>
            </div>
          </div>
        )}
        {/* Class Code Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
            {classData.code}
          </span>
        </div>
        {/* Status Icons */}
        <div className="absolute top-3 right-3 flex space-x-1">
          {classData.isPrivate && (
            <div className="bg-purple-500 text-white p-1 rounded">
              <Lock className="w-3 h-3" />
            </div>
          )}
          {classData.isArchived && (
            <div className="bg-gray-500 text-white p-1 rounded">
              <Archive className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black p-6 text-white">
        {/* Title and Description */}
        <h3 className="text-xl font-bold text-white mb-2 truncate">{classData.name}</h3>
        {classData.description && (
          <p className="text-sm text-gray-300 mb-4 line-clamp-2">{classData.description}</p>
        )}

        {/* Professor Info */}
        <div className="flex items-center mb-4">
          <Avatar 
            src={classData.professor.avatar} 
            alt={classData.professor.name} 
            size="sm"
            className="mr-3 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{classData.professor.name}</p>
            <p className="text-xs text-gray-400">Professor</p>
          </div>
        </div>

        {/* Course Details */}
        <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
          <span>{classData._count.enrollments} students</span>
          <span>{classData._count.notes} notes</span>
          <span>{classData._count.quizzes} quizzes</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button asChild className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-0 text-sm h-10">
            <Link href={`/classes/${classData.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Link>
          </Button>
          
          {isProfessor && (
            <>
              <Button
                onClick={handlePrivacyToggle}
                disabled={isUpdating}
                variant="outline"
                size="sm"
                title={classData.isPrivate ? 'Make Public' : 'Make Private'}
                className="bg-gray-300 border-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 h-10 px-3"
              >
                <Lock className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleArchiveToggle}
                disabled={isUpdating}
                variant="outline"
                size="sm"
                title={classData.isArchived ? 'Unarchive' : 'Archive'}
                className="bg-gray-300 border-gray-300 text-gray-700 hover:bg-gray-600 hover:text-white dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 h-10 px-3"
              >
                <Archive className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {user?.role === 'STUDENT' && !isEnrolled && !classData.isPrivate && !classData.isArchived && onEnroll && (
            <Button
              onClick={() => onEnroll(classData.id)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 h-10"
            >
              Enroll
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
