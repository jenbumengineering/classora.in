'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './Button'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Image,
  Link,
  Undo,
  Redo
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateValue()
  }

  const updateValue = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleFocus = () => {
    if (editorRef.current && !editorRef.current.textContent) {
      // If editor is empty, place cursor at the beginning
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(editorRef.current)
      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Markdown-like shortcuts
    if (e.key === 'Enter') {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const node = range.startContainer
        
        // Check if we're in a list item
        const listItem = node.nodeType === Node.TEXT_NODE 
          ? node.parentElement?.closest('li')
          : (node as Element).closest('li')
        
        if (listItem) {
          // Handle list continuation
          const list = listItem.parentElement
          if (list && list.tagName === 'UL') {
            e.preventDefault()
            execCommand('insertHTML', '<li><br></li>')
            return
          } else if (list && list.tagName === 'OL') {
            e.preventDefault()
            execCommand('insertHTML', '<li><br></li>')
            return
          }
        }
      }
    }
    
    // Handle backspace in empty list items
    if (e.key === 'Backspace') {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const node = range.startContainer
        
        const listItem = node.nodeType === Node.TEXT_NODE 
          ? node.parentElement?.closest('li')
          : (node as Element).closest('li')
        
        if (listItem && listItem.textContent?.trim() === '') {
          e.preventDefault()
          listItem.remove()
          updateValue()
        }
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    updateValue()
  }

  const insertImage = () => {
    if (imageUrl.trim()) {
      const imgTag = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
      execCommand('insertHTML', imgTag)
      setIsImageModalOpen(false)
      setImageUrl('')
      setImageAlt('')
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const formatText = (format: string) => {
    switch (format) {
      case 'bold':
        execCommand('bold')
        break
      case 'italic':
        execCommand('italic')
        break
      case 'underline':
        execCommand('underline')
        break
      case 'h1':
        execCommand('formatBlock', '<h1>')
        break
      case 'h2':
        execCommand('formatBlock', '<h2>')
        break
      case 'h3':
        execCommand('formatBlock', '<h3>')
        break
      case 'ul':
        execCommand('insertUnorderedList')
        break
      case 'ol':
        execCommand('insertOrderedList')
        break
      case 'quote':
        execCommand('formatBlock', '<blockquote>')
        break
      case 'code':
        execCommand('formatBlock', '<pre>')
        break
    }
  }

  return (
    <div className={`border border-gray-300 rounded-md rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('h1')}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('h2')}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('h3')}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('ul')}
          title="Unordered List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('ol')}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('quote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('code')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsImageModalOpen(true)}
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 focus:outline-none focus:ring-0"
        onInput={updateValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={updateValue}
        onFocus={handleFocus}
        style={{
          minHeight: '200px',
          lineHeight: '1.6',
          direction: 'ltr',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}
      />

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description of the image"
                />
              </div>
              <div className="flex space-x-3">
                <Button onClick={insertImage} disabled={!imageUrl.trim()}>
                  Insert Image
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsImageModalOpen(false)
                    setImageUrl('')
                    setImageAlt('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
