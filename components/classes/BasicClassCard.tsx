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
    gradientColor?: string
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
    <div className={`border rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${
      classData.isArchived 
        ? 'opacity-75 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
    }`}>
      {/* Main Content Container with Dark Gradient */}
      <div className={`bg-gradient-to-br ${selectedGradient} p-4 mb-4 text-white rounded-b-lg`}>
        {/* Class Info Section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{classData.name}</h3>
            <p className="text-sm text-blue-200 mb-1 font-medium">{classData.code}</p>
            <p className="text-sm text-blue-100">by {classData.professor.name}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {classData.isPrivate && (
              <Lock className="w-4 h-4 text-purple-300" />
            )}
            {classData.isArchived && (
              <Archive className="w-4 h-4 text-gray-300" />
            )}
          </div>
        </div>
        
        {classData.description && (
          <p className="text-blue-100 text-sm mb-4 line-clamp-2">{classData.description}</p>
        )}

        {/* Statistics Section with Light Gradient Border */}
        <div className="bg-white/10 rounded-lg p-3 border border-gradient-to-r from-blue-300 to-indigo-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center text-white font-semibold text-sm">
                <Users className="w-4 h-4 mr-1 text-blue-200" />
                <span className="text-lg font-bold">{classData._count.enrollments}</span>
              </div>
              <span className="text-xs text-blue-200 mt-1">Students</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-white font-semibold text-sm">
                <span className="text-lg font-bold">{classData._count.notes}</span>
              </div>
              <span className="text-xs text-blue-200 mt-1">Notes</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-white font-semibold text-sm">
                <span className="text-lg font-bold">{classData._count.quizzes}</span>
              </div>
              <span className="text-xs text-blue-200 mt-1">Quizzes</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-white font-semibold text-sm">
                <span className="text-lg font-bold">{classData._count.assignments}</span>
              </div>
              <span className="text-xs text-blue-200 mt-1">Assignments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons at Bottom */}
      <div className="flex space-x-2 p-6 pt-0">
        <Link href={`/classes/${classData.id}`} className="flex-1">
          <Button className={`w-full bg-gradient-to-r ${selectedGradient} hover:opacity-90 text-white border-0`} variant="outline">
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
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Lock className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleArchiveToggle}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              title={classData.isArchived ? 'Unarchive' : 'Archive'}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Archive className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {user?.role === 'STUDENT' && !isEnrolled && !classData.isPrivate && !classData.isArchived && onEnroll && (
          <Button
            onClick={() => onEnroll(classData.id)}
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
          >
            Enroll
          </Button>
        )}
      </div>
    </div>
  )
}
