import React from 'react'

interface UniversityLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function UniversityLogo({ 
  size = 'md', 
  showText = true, 
  className = '' 
}: UniversityLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-24 h-24 text-3xl'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#1B75BB] to-[#0d5a8a] rounded-lg flex items-center justify-center shadow-md`}>
        <div className={`text-white font-bold ${textSizeClasses[size]}`}>U</div>
      </div>
      {showText && (
        <div>
          <h1 className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
            University
          </h1>
          {size === 'lg' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Attendance Management System
            </p>
          )}
          {size === 'md' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Attendance System
            </p>
          )}
        </div>
      )}
    </div>
  )
}
