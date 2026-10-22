'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { CHECKOUT_CANCELLED, PRO_WELCOME } from '@/lib/plan-catalog'
import { toast } from '@/stores/toastStore'

/** Stripe returns here with ?billing=success or ?billing=cancel. */
export function BillingReturn() {
  const { user, loading, refreshProfile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const billing = params.get('billing')
    if (billing !== 'success' && billing !== 'cancel') return
    if (billing === 'success' && loading) return

    const marker = `${pathname}?${params.toString()}`
    if (handled.current === marker) return
    handled.current = marker

    if (billing === 'success') {
      toast.success(PRO_WELCOME)
      if (user) {
        void api.billing.status()
          .catch(() => null)
          .finally(() => {
            void refreshProfile()
            window.dispatchEvent(new Event('watchman-billing-refresh'))
          })
      }
    } else {
      toast.info(CHECKOUT_CANCELLED)
    }

    params.delete('billing')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [loading, pathname, refreshProfile, router, user])

  return null
}
