'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN'
  createdAt: string
  teacherProfile?: {
    university?: string
    college?: string
    department?: string
    phone?: string
    address?: string
  }
  studentProfile?: {
    university?: string
    college?: string
    department?: string
    semester?: string
    class?: string
    registrationNo?: string
    rollNo?: string
    phone?: string
    address?: string
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    university: '',
    college: '',
    department: '',
    semester: '',
    class: '',
    registrationNo: '',
    rollNo: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      // Load profile data from API
      const response = await fetch(`/api/auth/profile`, {
        headers: {
          'x-user-id': user.id,
        },
      })
      
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
        setEditForm({
          name: profileData.name,
          bio: profileData.bio || '',
          university: profileData.teacherProfile?.university || profileData.studentProfile?.university || '',
          college: profileData.teacherProfile?.college || profileData.studentProfile?.college || '',
          department: profileData.teacherProfile?.department || profileData.studentProfile?.department || '',
          semester: profileData.studentProfile?.semester || '',
          class: profileData.studentProfile?.class || '',
          registrationNo: profileData.studentProfile?.registrationNo || '',
          rollNo: profileData.studentProfile?.rollNo || '',
          phone: profileData.teacherProfile?.phone || profileData.studentProfile?.phone || '',
          address: profileData.teacherProfile?.address || profileData.studentProfile?.address || ''
        })
      } else {
        // Fallback to basic user data
        setProfile({
          id: user.id,
          name: user.name,
          email: user.email,
          bio: '',
          role: user.role,
          createdAt: new Date().toISOString()
        })
        setEditForm({
          name: user.name,
          bio: '',
          university: '',
          college: '',
          department: '',
          semester: '',
          class: '',
          registrationNo: '',
          rollNo: '',
          phone: '',
          address: ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback to basic user data
      setProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        bio: '',
        role: user.role,
        createdAt: new Date().toISOString()
      })
              setEditForm({
          name: user.name,
          bio: '',
          university: '',
          college: '',
          department: '',
          semester: '',
          class: '',
          registrationNo: '',
          rollNo: '',
          phone: '',
          address: ''
        })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Prepare the update data
      const updateData: any = {
        name: editForm.name,
        bio: editForm.bio
      }

      // Add teacher profile data for professors
      if (profile?.role === 'PROFESSOR') {
        updateData.teacherProfile = {
          university: editForm.university,
          college: editForm.college,
          department: editForm.department,
          phone: editForm.phone,
          address: editForm.address
        }
      }

      // Add student profile data for students
      if (profile?.role === 'STUDENT') {
        updateData.studentProfile = {
          university: editForm.university,
          college: editForm.college,
          department: editForm.department,
          semester: editForm.semester,
          class: editForm.class,
          registrationNo: editForm.registrationNo,
          rollNo: editForm.rollNo,
          phone: editForm.phone,
          address: editForm.address
        }
      }

      // Call API to update profile
      const response = await fetch(`/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        bio: profile.bio || '',
        university: profile.teacherProfile?.university || profile.studentProfile?.university || '',
        college: profile.teacherProfile?.college || profile.studentProfile?.college || '',
        department: profile.teacherProfile?.department || profile.studentProfile?.department || '',
        semester: profile.studentProfile?.semester || '',
        class: profile.studentProfile?.class || '',
        registrationNo: profile.studentProfile?.registrationNo || '',
        rollNo: profile.studentProfile?.rollNo || '',
        phone: profile.teacherProfile?.phone || profile.studentProfile?.phone || '',
        address: profile.teacherProfile?.address || profile.studentProfile?.address || ''
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userRole="STUDENT"
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
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-2">Manage your account information</p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{profile?.name}</h3>
                        <p className="text-gray-600">{profile?.role}</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{profile?.email}</p>
                        </div>
                      </div>

                      {profile?.role === 'PROFESSOR' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter phone number"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-900">{profile?.teacherProfile?.phone || 'Not provided'}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter address"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-900">{profile?.teacherProfile?.address || 'Not provided'}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Professor-specific fields */}
                    {profile?.role === 'PROFESSOR' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            University/College
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.university}
                              onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter university or college"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.teacherProfile?.university || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.department}
                              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter department"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.teacherProfile?.department || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Student-specific fields */}
                    {profile?.role === 'STUDENT' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              University/College/School
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.university}
                                onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter university, college, or school"
                              />
                            ) : (
                              <p className="text-gray-900">{profile?.studentProfile?.university || 'Not provided'}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Department/Semester/Class
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.department}
                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter department, semester, or class"
                              />
                            ) : (
                              <p className="text-gray-900">{profile?.studentProfile?.department || 'Not provided'}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Registration/Roll No
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.registrationNo}
                                onChange={(e) => setEditForm({ ...editForm, registrationNo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter registration or roll number"
                              />
                            ) : (
                              <p className="text-gray-900">{profile?.studentProfile?.registrationNo || 'Not provided'}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter phone number"
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-900">{profile?.studentProfile?.phone || 'Not provided'}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter address"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <p className="text-gray-900">{profile?.studentProfile?.address || 'Not provided'}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tell us about yourself"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.bio || 'No bio provided'}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex space-x-3 pt-4">
                        <Button onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Account Info */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Member since</p>
                      <p className="text-sm font-medium">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account type</p>
                      <p className="text-sm font-medium capitalize">{profile?.role?.toLowerCase()}</p>
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
