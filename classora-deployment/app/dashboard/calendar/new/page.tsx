'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SunEditorComponent } from '@/components/ui/SunEditor'
import { ArrowLeft, Save, Calendar, BookOpen, Code, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  code: string
}

interface Note {
  id: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED' | 'PRIVATE'
}

export default function NewEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'holiday',
    classId: '',
    dueDate: '',
    category: '',
    eventDate: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (user) {
      loadClasses()
    }
  }, [user])

  const loadClasses = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/classes?professorId=${user.id}`, {
        headers: {
          'x-user-id': user.id,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      } else {
        console.error('Failed to load classes')
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setIsLoadingClasses(false)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.eventType,
        date: formData.eventDate || formData.dueDate,
        classId: formData.classId || undefined,
        category: formData.category || undefined,
        priority: formData.priority
      }

      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        toast.success(`${formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1)} created successfully!`)
        router.push('/dashboard/calendar')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('An error occurred while creating the event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }))
  }

  if (!user || user.role !== 'PROFESSOR') {
    return (
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          userRole="PROFESSOR"
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader 
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
          />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-6">Only professors can create events.</p>
                <Button asChild>
                  <Link href="/dashboard/calendar">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Calendar
                  </Link>
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
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
            <div className="mb-8">
              <Button asChild variant="outline" className="mb-4">
                <Link href="/dashboard/calendar">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Calendar
                </Link>
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Add New Event</h1>
              <p className="text-gray-600 mt-2">Create a new holiday, academic event, or todo</p>
            </div>

            <div className="max-w-4xl">
              <Card>
                                 <CardHeader>
                   <CardTitle>Event Details</CardTitle>
                   <CardDescription>Fill in the details for your new calendar event</CardDescription>
                 </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                                         {/* Event Type Selection */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Event Type
                       </label>
                       <div className="grid grid-cols-3 gap-4">
                         <button
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, eventType: 'holiday' }))}
                           className={`p-4 border-2 rounded-lg text-center transition-colors ${
                             formData.eventType === 'holiday'
                               ? 'border-red-500 bg-red-50'
                               : 'border-gray-200 hover:border-gray-300'
                           }`}
                         >
                           <Calendar className="h-8 w-8 mx-auto mb-2 text-red-600" />
                           <div className="font-medium">Holiday</div>
                           <div className="text-sm text-gray-600">Public holidays</div>
                         </button>
                         
                         <button
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, eventType: 'academic' }))}
                           className={`p-4 border-2 rounded-lg text-center transition-colors ${
                             formData.eventType === 'academic'
                               ? 'border-orange-500 bg-orange-50'
                               : 'border-gray-200 hover:border-gray-300'
                           }`}
                         >
                           <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                           <div className="font-medium">Academic Event</div>
                           <div className="text-sm text-gray-600">Tests & examinations</div>
                         </button>
                         
                         <button
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, eventType: 'todo' }))}
                           className={`p-4 border-2 rounded-lg text-center transition-colors ${
                             formData.eventType === 'todo'
                               ? 'border-blue-500 bg-blue-50'
                               : 'border-gray-200 hover:border-gray-300'
                           }`}
                         >
                           <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                           <div className="font-medium">Todo</div>
                           <div className="text-sm text-gray-600">Personal tasks</div>
                         </button>
                       </div>
                     </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder={`Enter ${formData.eventType} title`}
                      />
                    </div>

                                         {/* Class Selection (Optional for holidays and todos) */}
                     {(formData.eventType === 'academic') && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Class *
                         </label>
                         {isLoadingClasses ? (
                           <div className="flex items-center space-x-2">
                             <LoadingSpinner size="sm" />
                             <span className="text-sm text-gray-600">Loading classes...</span>
                           </div>
                         ) : (
                           <select
                             value={formData.classId}
                             onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             required
                           >
                             <option value="">Select a class</option>
                             {classes.map(classItem => (
                               <option key={classItem.id} value={classItem.id}>
                                 {classItem.name} ({classItem.code})
                               </option>
                             ))}
                           </select>
                         )}
                       </div>
                     )}

                                         {/* Event Date */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Event Date *
                       </label>
                       <input
                         type="datetime-local"
                         value={formData.eventDate}
                         onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         required
                       />
                     </div>

                     {/* Category */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Category
                       </label>
                       <input
                         type="text"
                         value={formData.category}
                         onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder={
                           formData.eventType === 'holiday' ? 'e.g., National Holiday, Religious Holiday' :
                           formData.eventType === 'academic' ? 'e.g., Midterm Exam, Final Exam, Quiz' :
                           'e.g., Personal, Work, Study'
                         }
                       />
                     </div>

                     {/* Priority (for todos) */}
                     {formData.eventType === 'todo' && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Priority
                         </label>
                         <select
                           value={formData.priority}
                           onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="low">Low</option>
                           <option value="medium">Medium</option>
                           <option value="high">High</option>
                         </select>
                       </div>
                     )}

                                         {/* Description */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Description
                       </label>
                                               <SunEditorComponent
                          onChange={handleDescriptionChange}
                          value={formData.description}
                          placeholder={`Enter ${formData.eventType} description...`}
                        />
                     </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard/calendar')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="min-w-[120px]"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Create {formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1)}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
