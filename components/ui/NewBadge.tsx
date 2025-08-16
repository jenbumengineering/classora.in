import React from 'react'

interface NewBadgeProps {
  className?: string
}

export function NewBadge({ className = '' }: NewBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}>
      NEW
    </span>
  )
}
