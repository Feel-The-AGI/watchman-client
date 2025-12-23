import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  className?: string
  hover?: boolean
  variant?: 'default' | 'glass' | 'gradient' | 'outline'
  glow?: 'accent' | 'mint' | 'none'
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ 
  children, 
  className, 
  hover, 
  variant = 'default',
  glow = 'none',
  padding = 'md',
  ...props 
}: CardProps) {
  const variants = {
    default: 'bg-watchman-surface border border-white/5',
    glass: 'glass',
    gradient: 'border-gradient',
    outline: 'bg-transparent border border-white/10',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const glows = {
    none: '',
    accent: 'shadow-lg shadow-watchman-accent/10',
    mint: 'shadow-lg shadow-watchman-mint/10',
  }

  return (
    <motion.div
      className={cn(
        'rounded-2xl transition-all duration-300',
        variants[variant],
        paddings[padding],
        glows[glow],
        hover && 'hover:border-white/10 hover:bg-watchman-surface-hover hover:shadow-card-hover cursor-pointer hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export function CardTitle({ children, className, as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component className={cn('text-lg font-semibold text-watchman-text', className)}>
      {children}
    </Component>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-watchman-muted', className)}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-white/5', className)}>
      {children}
    </div>
  )
}

// Bento Card - Premium grid item
interface BentoCardProps {
  children: ReactNode
  className?: string
  span?: 1 | 2 | 3
  rowSpan?: 1 | 2
  gradient?: boolean
}

export function BentoCard({ children, className, span = 1, rowSpan = 1, gradient }: BentoCardProps) {
  const colSpans = {
    1: 'col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
  }

  const rowSpans = {
    1: 'row-span-1',
    2: 'md:row-span-2',
  }

  return (
    <motion.div
      className={cn(
        'bento-item',
        colSpans[span],
        rowSpans[rowSpan],
        gradient && 'border-gradient',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
