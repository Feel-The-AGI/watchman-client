import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingState({
  title,
  detail,
  children,
}: {
  title: string
  detail?: string
  children?: React.ReactNode
}) {
  return (
    <div className="w-full" role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="relative" aria-hidden="true">
          <div className="w-14 h-14 rounded-full border-2 border-watchman-accent/20 border-t-watchman-accent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-watchman-accent" />
          </div>
        </div>
        <p className="text-sm font-medium text-white">{title}</p>
        {detail ? <p className="text-xs text-watchman-muted text-center max-w-sm">{detail}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function BlockSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-white/5 border border-white/5', className)} />
}
