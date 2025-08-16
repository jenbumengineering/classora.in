'use client'

import Image from 'next/image'
import { Code } from 'lucide-react'
import { useSettings } from '@/components/providers/SettingsProvider'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'text' | 'full'
  className?: string
  theme?: 'light' | 'dark'
}

export function Logo({ size = 'md', variant = 'icon', className = '', theme = 'light' }: LogoProps) {
  const { settings } = useSettings()
  const siteName = settings?.siteName || 'Classora.in'
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  // You can replace this with your custom logo
  const logoSrc = theme === 'dark' ? '/logo-light.png' : '/logo.png' // Update this path to your logo
  const logoAlt = `${siteName} Logo`
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        {/* Use custom logo image if available, otherwise fallback to icon */}
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
            height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
            className="object-contain"
          />
        ) : (
          <Code className={`${sizeClasses[size]} text-primary-600`} />
        )}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center ${className}`}>
        <span className={`font-bold ${textColor} ${textSizes[size]}`}>
          {siteName}
        </span>
      </div>
    )
  }

  // Full variant (icon + text)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Use custom logo image if available, otherwise fallback to icon */}
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className="object-contain"
        />
      ) : (
        <Code className={`${sizeClasses[size]} text-primary-600`} />
      )}
      <span className={`font-bold ${textColor} ${textSizes[size]}`}>
        {siteName}
      </span>
    </div>
  )
}
