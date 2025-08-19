'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { useAdminData } from '@/components/providers/AdminDataProvider'
import { 
  MessageSquare, 
  Mail, 
  Clock, 
  User, 
  ArrowLeft,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  read: boolean
  replyMessage?: string
  repliedAt?: string
  repliedBy?: string
}

export default function AdminMessages() {
  const { user } = useAuth()
  const { adminData, updateMessages } = useAdminData()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  // Populate reply form when a message with reply is selected
  useEffect(() => {
    if (selectedMessage?.replyMessage && showReplyForm) {
      setReplyMessage(selectedMessage.replyMessage)
    }
  }, [selectedMessage, showReplyForm])

  const fetchMessages = async (forceRefresh = false) => {
    try {
      // Check if we have cached messages and not forcing refresh
      if (adminData.messages.length > 0 && !forceRefresh) {
        setMessages(adminData.messages)
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/messages', {
        headers: {
          'x-user-id': user?.id || ''
        },
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        const fetchedMessages = data.messages || []
        setMessages(fetchedMessages)
        updateMessages(fetchedMessages)
        if (forceRefresh) {
          toast.success('Messages refreshed successfully')
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMessages(true)
  }

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const updatedMessages = messages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
        setMessages(updatedMessages)
        updateMessages(updatedMessages)
        toast.success('Message marked as read')
        // Refresh messages to ensure we have the latest data
        await fetchMessages(true)
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
      toast.error('Failed to mark message as read')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || ''
        }
      })
      if (response.ok) {
        const updatedMessages = messages.filter(msg => msg.id !== messageId)
        setMessages(updatedMessages)
        updateMessages(updatedMessages)
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null)
        }
        toast.success('Message deleted')
        // Refresh messages to ensure we have the latest data
        await fetchMessages(true)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const sendReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) {
      toast.error('Please enter a reply message')
      return
    }

    setSendingReply(true)
    try {
      const response = await fetch(`/api/admin/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          replyMessage: replyMessage.trim(),
          adminName: user?.name || 'Classora Support'
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(selectedMessage.replyMessage ? 'Reply updated successfully' : 'Reply sent successfully')
        setReplyMessage('')
        setShowReplyForm(false)
        // Update message with reply data
        const updatedMessages = messages.map(msg => 
          msg.id === selectedMessage.id ? { 
            ...msg, 
            read: true,
            replyMessage: replyMessage.trim(),
            repliedAt: new Date().toISOString(),
            repliedBy: user?.name || 'Admin'
          } : msg
        )
        setMessages(updatedMessages)
        updateMessages(updatedMessages)
        setSelectedMessage(prev => prev ? { 
          ...prev, 
          read: true,
          replyMessage: replyMessage.trim(),
          repliedAt: new Date().toISOString(),
          repliedBy: user?.name || 'Admin'
        } : null)
        // Refresh messages to ensure we have the latest data
        await fetchMessages(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send reply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const filteredMessages = messages.filter(message => {
    if (filter === 'unread') return !message.read
    if (filter === 'read') return message.read && !message.replyMessage
    if (filter === 'replied') return message.replyMessage
    return true
  })

  const unreadCount = messages.filter(msg => !msg.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
                <p className="text-gray-600">Manage contact form submissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
              <div className="text-right">
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Message List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Messages ({filteredMessages.length})
                    </CardTitle>
                    <CardDescription>Contact form submissions from users</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={filter === 'all' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unread')}
                    >
                      Unread
                    </Button>
                    <Button
                      variant={filter === 'read' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('read')}
                    >
                      Read
                    </Button>
                    <Button
                      variant={filter === 'replied' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('replied')}
                    >
                      Replied
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'border-blue-500 bg-blue-50'
                            : message.read
                            ? 'border-gray-200 bg-white'
                            : 'border-red-200 bg-red-50'
                        }`}
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{message.subject}</h3>
                              {!message.read && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  New
                                </span>
                              )}
                              {message.replyMessage && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Replied
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              From: {message.name} ({message.email})
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {message.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(message.timestamp).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{message.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!message.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(message.id)
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteMessage(message.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Message Details</span>
                    {!selectedMessage.read && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Unread
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <p className="text-gray-900">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">From</label>
                    <p className="text-gray-900">{selectedMessage.name}</p>
                    <p className="text-gray-600">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>
                  
                  {/* Reply Section */}
                  {selectedMessage.replyMessage && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Admin Reply</label>
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.replyMessage}</p>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Replied by: {selectedMessage.repliedBy || 'Admin'}</p>
                          <p>Date: {selectedMessage.repliedAt ? new Date(selectedMessage.repliedAt).toLocaleString() : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {selectedMessage.replyMessage ? 'Update Reply' : 'Reply'}
                    </Button>
                    {!selectedMessage.read && (
                      <Button
                        onClick={() => markAsRead(selectedMessage.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>

                  {/* Reply Form */}
                  {showReplyForm && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {selectedMessage.replyMessage ? 'Update Reply Message' : 'Reply Message'}
                        </label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder={selectedMessage.replyMessage ? "Update your reply here..." : "Type your reply here..."}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={sendReply}
                          disabled={sendingReply || !replyMessage.trim()}
                          className="flex-1"
                        >
                          {sendingReply ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Reply
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReplyForm(false)
                            setReplyMessage('')
                          }}
                          disabled={sendingReply}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a message to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
