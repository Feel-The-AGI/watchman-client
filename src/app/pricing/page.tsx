'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { PlanComparison } from '@/components/billing/PlanComparison';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { authNavChoice } from '@/lib/signup-flow';
import { paymentsProvider } from '@/lib/payments-provider';
import {
  COMING_SOON_LABEL,
  FOUNDING_BADGE_PREFIX,
  FOUNDING_BUTTON_LABEL,
  FOUNDING_FULL_MESSAGE,
  FREE_FEATURES,
  PLAN_FREE_TICK,
  FREE_PLAN_BLURB,
  PLAN_PRICES,
  PRICING_HEADLINE,
  PRICING_SUB,
  PRO_EXTRA_FEATURES,
  PRO_INTRO,
  READABLE_TEXT,
  SMALL_PRINT,
  START_FREE_LABEL,
  YEARLY_INTRO,
  foundingBadge,
  foundingFeatures,
  monthlyButtonLabel,
  pricingFaqs,
  yearlyAboutLine,
  yearlyButtonLabel,
} from '@/lib/plan-catalog';
import {
  clearPendingCheckout,
  isCheckoutPlan,
  normalizeSeatsLeft,
  readPendingCheckout,
  rememberPendingCheckout,
  signupPathForPlan,
  stripeBillingError,
  type CheckoutPlan,
} from '@/lib/stripe-checkout';

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const checkoutOpen = paymentsProvider() === 'stripe';
  const [paymentsClosed, setPaymentsClosed] = useState(false);
  const [pending, setPending] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const autoStarted = useRef(false);
  const canCharge = checkoutOpen && !paymentsClosed;
  const foundingFull = seatsLeft !== null && seatsLeft <= 0;

  useEffect(() => {
    let cancelled = false;
    api.billing.founding()
      .then((payload) => {
        if (!cancelled) setSeatsLeft(normalizeSeatsLeft(payload));
      })
      .catch(() => {
        if (!cancelled) setSeatsLeft(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading || autoStarted.current) return;
    const plan = new URLSearchParams(window.location.search).get('checkout');
    if (!isCheckoutPlan(plan)) return;
    if (!user) return;
    autoStarted.current = true;
    clearPendingCheckout();
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    if (!canCharge) return;
    void choosePlan(plan);
  }, [authLoading, user, canCharge]);

  const choosePlan = async (plan: CheckoutPlan) => {
    if (!canCharge) return;
    if (!user) {
      rememberPendingCheckout(plan);
      router.push(signupPathForPlan(plan));
      return;
    }
    if (plan === 'founding' && foundingFull) return;
    try {
      setPending(plan);
      setError(null);
      const result = await api.billing.checkout(plan);
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      setError("Checkout didn't open. Nothing was charged.");
      setPending(null);
    } catch (err: unknown) {
      const mapped = stripeBillingError(err);
      if (mapped.code === 'unconfigured') setPaymentsClosed(true);
      if (mapped.code === 'full') setSeatsLeft(0);
      setError(mapped.message);
      setPending(null);
    }
  };

  const startFree = () => {
    router.push(user ? '/dashboard' : '/login?mode=signup');
  };

  // A signed-out visitor who already picked a plan should still land in sign-up
  // if they refresh the pricing page before the session exists.
  useEffect(() => {
    if (authLoading || user) return;
    const pendingPlan = readPendingCheckout();
    const requested = new URLSearchParams(window.location.search).get('checkout');
    if (pendingPlan && isCheckoutPlan(requested) && requested === pendingPlan) {
      router.replace(signupPathForPlan(pendingPlan));
    }
  }, [authLoading, router, user]);

  return (
    <div className="min-h-screen bg-watchman-bg text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/3 h-[600px] w-[600px] rounded-full bg-watchman-accent/10 blur-[180px]" />
        <div className="absolute bottom-0 right-1/3 h-[500px] w-[500px] rounded-full bg-watchman-purple/10 blur-[150px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 glass-strong">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Logo size="md" />
            <span className="truncate text-xl font-bold tracking-tight">Watchman</span>
          </Link>
          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: READABLE_TEXT }}>
              Home
            </Link>
            {authNavChoice(authLoading, user) === 'pending' ? (
              <span className="inline-block h-9 w-24 rounded-xl bg-white/5" aria-hidden="true" />
            ) : authNavChoice(authLoading, user) === 'in' ? (
              <Link href="/dashboard">
                <Button variant="gradient" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="gradient" size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-8 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple shadow-xl shadow-watchman-accent/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">{PRICING_HEADLINE}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: READABLE_TEXT }}>
            {PRICING_SUB}
          </p>
        </div>
      </section>

      {error && (
        <div className="relative mx-auto mb-6 max-w-3xl px-4 sm:px-6">
          <p className="rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm text-red-200" role="alert" data-testid="billing-error">
            {error}
          </p>
        </div>
      )}

      <section className="relative px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          <PlanCard
            name="Free"
            price={`$${PLAN_PRICES.free}`}
            period=""
            note={FREE_PLAN_BLURB}
            features={[...FREE_FEATURES]}
            action={(
              <Button variant="glass" size="lg" className="w-full whitespace-normal" onClick={startFree}>
                {START_FREE_LABEL}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          />
          <PlanCard
            name="Pro monthly"
            price={`$${PLAN_PRICES.monthly}`}
            period="/ month"
            note="billed monthly"
            intro={PRO_INTRO}
            features={[...PRO_EXTRA_FEATURES]}
            action={(
              <PaidButton
                plan="monthly"
                label={canCharge ? monthlyButtonLabel() : COMING_SOON_LABEL}
                disabled={!canCharge}
                pending={pending === 'monthly'}
                onClick={() => void choosePlan('monthly')}
              />
            )}
          />
          <PlanCard
            name="Pro yearly"
            price={`$${PLAN_PRICES.yearly}`}
            period="/ year"
            badge={PLAN_PRICES.yearlySavingsBadge}
            note="billed yearly"
            detail={yearlyAboutLine()}
            intro={YEARLY_INTRO}
            highlighted
            action={(
              <PaidButton
                plan="yearly"
                label={canCharge ? yearlyButtonLabel() : COMING_SOON_LABEL}
                disabled={!canCharge}
                pending={pending === 'yearly'}
                onClick={() => void choosePlan('yearly')}
              />
            )}
          />
          <PlanCard
            name="Founding 100"
            price={`$${PLAN_PRICES.founding}`}
            period="/ year"
            badge={seatsLeft === null ? FOUNDING_BADGE_PREFIX : foundingBadge(seatsLeft)}
            note="billed yearly"
            features={[...foundingFeatures()]}
            tone="founding"
            action={foundingFull ? (
              <p className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-100" data-testid="founding-sold-out">
                {FOUNDING_FULL_MESSAGE}
              </p>
            ) : (
              <PaidButton
                plan="founding"
                label={canCharge ? FOUNDING_BUTTON_LABEL : COMING_SOON_LABEL}
                disabled={!canCharge}
                pending={pending === 'founding'}
                onClick={() => void choosePlan('founding')}
              />
            )}
          />
        </div>
        <p
          className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed"
          style={{ color: READABLE_TEXT }}
          data-testid="billing-small-print"
        >
          {SMALL_PRINT}
        </p>
      </section>

      <section className="relative border-t border-white/5 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Feature Comparison</h2>
          <div className="rounded-2xl border border-white/10 bg-watchman-surface/80 p-3 sm:p-5">
            <PlanComparison />
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4" data-testid="pricing-faq">
            {pricingFaqs().map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-white/5 bg-watchman-surface/70 p-5 sm:p-6">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: READABLE_TEXT }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/5 px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="font-semibold">Watchman</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: READABLE_TEXT }}>
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          </div>
          <p className="text-sm" style={{ color: READABLE_TEXT }}>© {new Date().getFullYear()} Watchman</p>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  badge,
  note,
  detail,
  intro,
  features,
  action,
  highlighted = false,
  tone = 'default',
}: {
  name: string
  price: string
  period: string
  badge?: string
  note?: string
  detail?: string
  intro?: string
  features?: string[]
  action: ReactNode
  highlighted?: boolean
  tone?: 'default' | 'founding'
}) {
  return (
    <article
      className={`flex min-w-0 flex-col rounded-3xl border p-5 sm:p-6 ${
        highlighted
          ? 'border-watchman-accent/40 bg-watchman-surface'
          : tone === 'founding'
            ? 'border-amber-400/30 bg-watchman-surface'
            : 'border-white/10 bg-watchman-surface/80'
      }`}
      data-testid={`plan-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {badge && (
        <p
          className={`mb-4 w-fit max-w-full break-words rounded-full px-3 py-1 text-xs font-semibold ${
            tone === 'founding' ? 'bg-amber-400/15 text-amber-100' : 'bg-watchman-accent/15 text-sky-100'
          }`}
          data-testid={tone === 'founding' ? 'founding-badge' : undefined}
        >
          {badge}
        </p>
      )}
      <h2 className="text-xl font-bold">{name}</h2>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-1">
        <span className="text-4xl font-bold tracking-tight sm:text-5xl">{price}</span>
        {period && <span className="text-lg" style={{ color: READABLE_TEXT }}>{period}</span>}
      </p>
      {note && <p className="mt-2 text-sm" style={{ color: READABLE_TEXT }}>{note}</p>}
      {detail && <p className="mt-1 text-sm text-zinc-100">{detail}</p>}
      <div className="my-5">{action}</div>
      {intro && <p className="mb-3 text-sm font-medium text-zinc-100">{intro}</p>}
      {features && features.length > 0 && (
        <ul className="space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PLAN_FREE_TICK }} aria-hidden="true" />
              <span style={{ color: READABLE_TEXT }}>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PaidButton({
  plan,
  label,
  disabled,
  pending,
  onClick,
}: {
  plan: CheckoutPlan
  label: string
  disabled: boolean
  pending: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant={disabled ? 'secondary' : 'gradient'}
      size="lg"
      className="w-full whitespace-normal text-center"
      data-testid={`checkout-${plan}`}
      onClick={onClick}
      disabled={disabled || pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}
