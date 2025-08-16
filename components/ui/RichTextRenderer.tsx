'use client'

import { useEffect, useRef } from 'react'

interface RichTextRendererProps {
  content: string
  className?: string
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = content
    }
  }, [content])

  return (
    <div 
      ref={containerRef}
      className={`rich-text-content ${className}`}
      style={{
        lineHeight: '1.6',
        fontSize: '14px'
      }}
    />
  )
}
