'use client'

import * as React from 'react'
import { Moon, Sun, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('dark-modern')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-[1.2rem] w-[1.2rem]" />
    } else if (theme === 'dark') {
      return <Moon className="h-[1.2rem] w-[1.2rem]" />
    } else {
      return <Palette className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  const getLabel = () => {
    if (theme === 'light') {
      return 'Switch to Dark Mode'
    } else if (theme === 'dark') {
      return 'Switch to Modern Dark Mode'
    } else {
      return 'Switch to Light Mode'
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={getLabel()}
      className="relative overflow-hidden"
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}