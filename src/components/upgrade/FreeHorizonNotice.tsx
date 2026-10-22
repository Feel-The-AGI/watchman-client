import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FREE_HORIZON_MESSAGE } from '@/lib/free-horizon'
import { upgradeAheadLabel } from '@/lib/plan-catalog'

export function FreeHorizonNotice({ compact = false, message = FREE_HORIZON_MESSAGE }: { compact?: boolean; message?: string }) {
  return (
    <div className={compact ? 'text-center' : 'flex flex-col items-center text-center gap-3'}>
      {!compact && (
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-watchman-muted" />
        </div>
      )}
      <p className={compact ? 'text-xs text-watchman-text' : 'text-sm text-watchman-text max-w-xs'}>
        {message}
      </p>
      <Link href="/pricing" className={compact ? 'mt-2 inline-block max-w-full' : 'inline-block max-w-full'}>
        <Button variant="gradient" size="sm" className="h-auto whitespace-normal px-3 py-2 text-center leading-snug">
          {upgradeAheadLabel()}
        </Button>
      </Link>
    </div>
  )
}
