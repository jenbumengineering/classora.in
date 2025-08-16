'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import SunEditor from 'suneditor-react'
import 'suneditor/dist/css/suneditor.min.css'

interface SunEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SunEditorComponent({ value, onChange, placeholder, className = '' }: SunEditorProps) {
  const editorRef = useRef<any>(null)
  const [hasError, setHasError] = useState(false)
  const [internalValue, setInternalValue] = useState(value)
  const isUpdatingRef = useRef(false)

  // Update internal value when prop changes, but only if we're not currently updating
  useEffect(() => {
    if (!isUpdatingRef.current && value !== internalValue) {
      setInternalValue(value)
    }
  }, [value, internalValue])

  const getSunEditorInstance = (sunEditor: any) => {
    try {
      editorRef.current = sunEditor
    } catch (error) {
      console.error('Error initializing SunEditor:', error)
      setHasError(true)
    }
  }

  const handleChange = useCallback((content: string) => {
    // Prevent infinite loops by checking if we're already updating
    if (isUpdatingRef.current) return
    
    // Only call onChange if the content has actually changed
    if (content !== internalValue) {
      isUpdatingRef.current = true
      setInternalValue(content)
      onChange(content)
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 0)
    }
  }, [internalValue, onChange])

  // Debug logging to help identify issues
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SunEditor value changed:', { value, internalValue })
    }
  }, [value, internalValue])

  const options = {
    buttonList: [
      ['undo', 'redo'],
      ['font', 'fontSize', 'formatBlock'],
      ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
      ['fontColor', 'hiliteColor'],
      ['removeFormat'],
      ['outdent', 'indent'],
      ['align', 'horizontalRule', 'list', 'lineHeight'],
      ['table', 'link', 'image'],
      ['fullScreen', 'showBlocks', 'codeView'],
      ['preview']
    ],
    align: ['left', 'center', 'right', 'justify'],
    placeholder: placeholder || 'Enter content here...',
    height: '300px',
    width: '100%',
    resizingBar: true,
    resizingBarContainer: '.sun-editor-container',
    charCounter: false,
    formats: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as any,
    font: [
      'Arial',
      'Calibri',
      'Comic Sans',
      'Courier',
      'Garamond',
      'Georgia',
      'Impact',
      'Lucida Console',
      'Tahoma',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana'
    ],
    fontSize: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
    colorList: [
      '#ff0000', '#ff6000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40', '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff', '#ff00ff', '#ff00bf', '#ff0080', '#ff0040', '#ff0020',
      '#000000', '#4d0000', '#990000', '#e60000', '#ff1a1a', '#ff4d4d', '#ff8080', '#ffb3b3', '#ffe6e6', '#f2ffe6', '#ccffcc', '#99ff99', '#66ff66', '#33ff33', '#00ff00', '#00e600', '#00cc00', '#00b300', '#009900', '#008000', '#006600', '#004d00', '#003300', '#001a00'
    ] as any,
    imageUploadUrl: '/api/upload-image',
    imageUploadSizeLimit: 5242880, // 5MB
    imageUploadAccept: 'image/*',
    imageResizing: true,
    imageWidth: '100%',
    imageHeight: 'auto',
    imageFileInput: true,
    imageUrlInput: true,
    imageAltInput: true,
    imageTitleInput: true,
    linkRel: ['nofollow', 'noopener', 'noreferrer'],
    linkProtocol: 'https://',
    linkTarget: '_blank',
    tableStyles: {
      'table': 'table table-bordered',
      'thead': 'table-header',
      'tbody': 'table-body',
      'tr': 'table-row',
      'td': 'table-cell',
      'th': 'table-header-cell'
    },
    // Disable problematic features that might cause errors
    showPathLabel: false,
    katex: undefined,
    math: undefined,
    video: undefined,
    audio: undefined
  }

  if (hasError) {
    return (
      <div className={`border border-red-300 rounded-md p-4 ${className}`}>
        <div className="text-red-600 mb-2">Editor failed to load. Using fallback textarea.</div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Enter content here...'}
          className="w-full min-h-[300px] p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ resize: 'vertical' }}
        />
      </div>
    )
  }

  return (
    <div className={`sun-editor-container ${className}`}>
      <SunEditor
        key="sun-editor"
        setContents={internalValue}
        onChange={handleChange}
        onLoad={getSunEditorInstance}
        setOptions={options}
        setDefaultStyle="font-family: Arial; font-size: 14px;"
      />
    </div>
  )
}
