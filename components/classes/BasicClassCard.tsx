'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { Lock, Archive, Eye, Users } from 'lucide-react'
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
    createdAt: string
    professor: {
      id: string
      name: string
      email: string
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
    <div className={`border rounded-lg p-6 bg-white hover:shadow-lg transition-shadow ${
      classData.isArchived ? 'opacity-75 bg-gray-50' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{classData.name}</h3>
          <p className="text-sm text-gray-600 mb-1">{classData.code}</p>
          <p className="text-sm text-gray-500">by {classData.professor.name}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {classData.isPrivate && (
            <Lock className="w-4 h-4 text-gray-500" title="Private Class" />
          )}
          {classData.isArchived && (
            <Archive className="w-4 h-4 text-gray-500" title="Archived Class" />
          )}
        </div>
      </div>
      
      {classData.description && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{classData.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {classData._count.enrollments} students
          </span>
          <span>{classData._count.notes} notes</span>
          <span>{classData._count.quizzes} quizzes</span>
          <span>{classData._count.assignments} assignments</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Link href={`/classes/${classData.id}`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Class
          </Button>
        </Link>
        
        {isProfessor && (
          <>
            <Button
              onClick={handlePrivacyToggle}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              title={classData.isPrivate ? 'Make Public' : 'Make Private'}
            >
              <Lock className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleArchiveToggle}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              title={classData.isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {user?.role === 'STUDENT' && !isEnrolled && !classData.isPrivate && !classData.isArchived && onEnroll && (
          <Button
            onClick={() => onEnroll(classData.id)}
            size="sm"
            className="flex-1"
          >
            Enroll
          </Button>
        )}
      </div>
    </div>
  )
}
