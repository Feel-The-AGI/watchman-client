'use client'

import { Crown, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlanComparison } from '@/components/billing/PlanComparison'
import {
  COMING_SOON_LABEL,
  FOUNDING_BUTTON_LABEL,
  FOUNDING_FULL_MESSAGE,
  READABLE_TEXT,
  monthlyButtonLabel,
  yearlyButtonLabel,
} from '@/lib/plan-catalog'
import {
  billingPeriodLine,
  billingPlanDetail,
  billingPlanName,
  isPaidBillingPlan,
  type BillingStatus,
  type CheckoutPlan,
} from '@/lib/stripe-checkout'

export function StripeBillingPanel({
  status,
  pending,
  checkoutOpen,
  error,
  onCheckout,
  onPortal,
}: {
  status: BillingStatus | null
  pending: CheckoutPlan | 'portal' | null
  checkoutOpen: boolean
  error: string | null
  onCheckout: (plan: CheckoutPlan) => void
  onPortal: () => void
}) {
  const plan = status?.plan ?? 'free'
  const name = billingPlanName(plan)
  const period = status ? billingPeriodLine(status) : null
  const paid = isPaidBillingPlan(plan)
  const seats = status?.founding_seats_left ?? null
  const foundingFull = seats !== null && seats <= 0

  return (
    <div className="space-y-6" data-testid="settings-billing">
      <div className="rounded-2xl border border-white/5 bg-watchman-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Current plan</h2>
        <div className="mt-4 flex flex-col gap-4 rounded-xl bg-watchman-bg p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${paid ? 'bg-watchman-accent' : 'bg-white/10'}`}>
              {paid ? <Crown className="h-6 w-6 text-white" /> : <Zap className="h-6 w-6 text-white" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold" data-testid="billing-plan-name">{name}</h3>
              <p className="text-sm" style={{ color: READABLE_TEXT }}>{billingPlanDetail(plan)}</p>
              {period && (
                <p className="mt-1 text-sm text-zinc-100" data-testid="billing-period">{period}</p>
              )}
              {status?.status === 'past_due' && (
                <p className="mt-1 text-sm text-amber-200">Payment needs attention. Manage the subscription to update the card.</p>
              )}
            </div>
          </div>
          {paid && (
            <Button
              variant="primary"
              className="w-full shrink-0 sm:w-auto"
              data-testid="manage-subscription"
              onClick={onPortal}
              disabled={pending !== null}
            >
              {pending === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Manage subscription
            </Button>
          )}
        </div>

        {!paid && plan !== 'admin' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm" style={{ color: READABLE_TEXT }}>Upgrade options</p>
            <div className="flex flex-col gap-2">
              <UpgradeButton
                label={checkoutOpen ? monthlyButtonLabel() : COMING_SOON_LABEL}
                disabled={!checkoutOpen || pending !== null}
                pending={pending === 'monthly'}
                onClick={() => onCheckout('monthly')}
                testId="upgrade-monthly"
              />
              <UpgradeButton
                label={checkoutOpen ? yearlyButtonLabel() : COMING_SOON_LABEL}
                disabled={!checkoutOpen || pending !== null}
                pending={pending === 'yearly'}
                onClick={() => onCheckout('yearly')}
                testId="upgrade-yearly"
              />
              {foundingFull ? (
                <p className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-100" data-testid="founding-sold-out">
                  {FOUNDING_FULL_MESSAGE}
                </p>
              ) : (
                <UpgradeButton
                  label={checkoutOpen ? FOUNDING_BUTTON_LABEL : COMING_SOON_LABEL}
                  disabled={!checkoutOpen || pending !== null}
                  pending={pending === 'founding'}
                  onClick={() => onCheckout('founding')}
                  testId="upgrade-founding"
                />
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-300" role="alert" data-testid="billing-error">{error}</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-watchman-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Plan features</h2>
        <p className="mt-1 text-sm" style={{ color: READABLE_TEXT }}>
          The same list as the pricing page. Leave planning is part of Pro.
        </p>
        <div className="mt-4">
          <PlanComparison />
        </div>
      </div>
    </div>
  )
}

function UpgradeButton({
  label,
  disabled,
  pending,
  onClick,
  testId,
}: {
  label: string
  disabled: boolean
  pending: boolean
  onClick: () => void
  testId: string
}) {
  return (
    <Button
      variant="secondary"
      className="w-full whitespace-normal"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}
