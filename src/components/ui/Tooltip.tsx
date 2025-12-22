'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      // Show below if too close to top of screen
      setPosition(rect.top < 100 ? 'bottom' : 'top')
    }
  }, [isVisible])

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="p-0.5 text-watchman-muted hover:text-watchman-accent transition-colors focus:outline-none"
        aria-label="More info"
      >
        {children || <Info className="w-4 h-4" />}
      </button>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-sm bg-watchman-card border border-white/10 rounded-lg shadow-lg max-w-xs',
            'text-watchman-text whitespace-normal',
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            'left-1/2 -translate-x-1/2'
          )}
        >
          {content}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-watchman-card border-white/10 rotate-45',
              position === 'top' 
                ? 'top-full -mt-1 border-r border-b' 
                : 'bottom-full -mb-1 border-l border-t'
            )}
          />
        </div>
      )}
    </div>
  )
}

// Label with tooltip helper
interface LabelWithTooltipProps {
  label: string
  tooltip: string
  htmlFor?: string
  className?: string
}

export function LabelWithTooltip({ label, tooltip, htmlFor, className }: LabelWithTooltipProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-watchman-text"
      >
        {label}
      </label>
      <Tooltip content={tooltip} />
    </div>
  )
}
