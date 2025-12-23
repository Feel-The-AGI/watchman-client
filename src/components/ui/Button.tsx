import { cn } from '@/lib/utils'
import { forwardRef, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'glass' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  glow?: boolean
  children?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, glow, ...props }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center font-medium rounded-xl
      transition-all duration-300 ease-spring
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-watchman-bg
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      overflow-hidden
    `
    
    const variants = {
      primary: `
        bg-watchman-accent text-white
        hover:bg-watchman-accent-hover hover:scale-[1.02]
        active:scale-[0.98]
        focus:ring-watchman-accent
        shadow-lg shadow-watchman-accent/20
      `,
      secondary: `
        bg-white/5 text-watchman-text border border-white/10
        hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]
        active:scale-[0.98]
        focus:ring-white/30
      `,
      ghost: `
        text-watchman-text-secondary
        hover:text-watchman-text hover:bg-white/5
        active:scale-[0.98]
        focus:ring-white/20
      `,
      danger: `
        bg-watchman-error text-white
        hover:bg-red-600 hover:scale-[1.02]
        active:scale-[0.98]
        focus:ring-watchman-error
        shadow-lg shadow-watchman-error/20
      `,
      success: `
        bg-watchman-success text-white
        hover:bg-green-600 hover:scale-[1.02]
        active:scale-[0.98]
        focus:ring-watchman-success
        shadow-lg shadow-watchman-success/20
      `,
      glass: `
        glass text-watchman-text
        hover:bg-white/10 hover:scale-[1.02]
        active:scale-[0.98]
        focus:ring-white/30
      `,
      gradient: `
        bg-gradient-to-r from-watchman-accent via-watchman-purple to-watchman-pink
        text-white font-semibold
        hover:scale-[1.02] hover:shadow-xl hover:shadow-watchman-accent/30
        active:scale-[0.98]
        focus:ring-watchman-accent
        bg-[length:200%_100%] animate-gradient-shift
      `,
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      xl: 'px-8 py-4 text-lg gap-3',
    }

    const glowStyles = glow ? 'animate-pulse-glow' : ''
    
    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], glowStyles, className)}
        disabled={disabled || loading}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {/* Shine overlay */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
