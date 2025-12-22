import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'
import { Tooltip } from './Tooltip'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  tooltip?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, tooltip, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
    
    return (
      <div className="space-y-1">
        {label && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-watchman-text"
            >
              {label}
            </label>
            {tooltip && <Tooltip content={tooltip} />}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-watchman-bg border border-watchman-border rounded-lg text-watchman-text placeholder:text-watchman-muted focus:outline-none focus:ring-2 focus:ring-watchman-accent focus:border-transparent transition-all',
            error && 'border-watchman-error focus:ring-watchman-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-watchman-error">{error}</p>
        )}
        {helper && !error && (
          <p className="text-sm text-watchman-muted">{helper}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
    
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-watchman-text"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-watchman-bg border border-watchman-border rounded-lg text-watchman-text placeholder:text-watchman-muted focus:outline-none focus:ring-2 focus:ring-watchman-accent focus:border-transparent transition-all resize-none',
            error && 'border-watchman-error focus:ring-watchman-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-watchman-error">{error}</p>
        )}
        {helper && !error && (
          <p className="text-sm text-watchman-muted">{helper}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
