'use client'

import { useState, useCallback } from 'react'
import { SunEditorComponent } from '@/components/ui/SunEditor'

export default function TestEditorPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleTitleChange = useCallback((newTitle: string) => {
    console.log('Title changed:', newTitle)
    setTitle(newTitle)
  }, [])

  const handleContentChange = useCallback((newContent: string) => {
    console.log('Content changed:', newContent)
    setContent(newContent)
  }, [])

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Editor Test Page</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <SunEditorComponent
            value={content}
            onChange={handleContentChange}
            placeholder="Enter content..."
          />
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Current Values:</h3>
          <p><strong>Title:</strong> "{title}"</p>
          <p><strong>Content:</strong> "{content.substring(0, 100)}..."</p>
        </div>
      </div>
    </div>
  )
}
