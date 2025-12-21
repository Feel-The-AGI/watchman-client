'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizes = {
  sm: { width: 32, height: 32, text: 'text-lg' },
  md: { width: 40, height: 40, text: 'text-xl' },
  lg: { width: 56, height: 56, text: 'text-2xl' },
  xl: { width: 80, height: 80, text: 'text-3xl' },
}

export function Logo({ size = 'md', className, showText = true }: LogoProps) {
  const { width, height, text } = sizes[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div 
        className="relative overflow-hidden rounded-xl shadow-lg"
        style={{ width, height }}
      >
        <Image
          src="/logo.png"
          alt="Watchman Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <span className={cn('font-semibold text-white', text)}>
          Watchman
        </span>
      )}
    </div>
  )
}

export function LogoIcon({ size = 'md', className }: Omit<LogoProps, 'showText'>) {
  const { width, height } = sizes[size]

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-xl shadow-lg',
        className
      )}
      style={{ width, height }}
    >
      <Image
        src="/logo.png"
        alt="Watchman Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
