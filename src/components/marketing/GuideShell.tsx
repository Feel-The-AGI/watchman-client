import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Faq } from '@/lib/schedule-library'

/** Header, footer and width for the free tools and guide pages. */
export function GuideShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-watchman-bg text-watchman-text overflow-x-hidden">
      <header className="border-b border-white/5">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/watchman-logo.png" alt="" width={32} height={32} className="rounded-full" />
            <span className="font-bold tracking-tight">Watchman</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-6 text-sm min-w-0">
            <Link href="/tools/shift-calculator" className="text-white/70 hover:text-white hidden sm:inline">Calculator</Link>
            <Link href="/schedules" className="text-white/70 hover:text-white">Schedules</Link>
            <Link href="/pricing" className="text-white/70 hover:text-white hidden sm:inline">Pricing</Link>
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center px-3 sm:px-4 min-h-[40px] rounded-xl bg-watchman-accent hover:bg-watchman-accent-hover text-white font-medium whitespace-nowrap"
            >
              Sign up<span className="hidden sm:inline">&nbsp;free</span>
            </Link>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 justify-between text-sm text-white/60">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/tools/shift-calculator" className="hover:text-white">Shift calculator</Link>
            <Link href="/schedules" className="hover:text-white">Shift schedules</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          </div>
          <p>© Watchman. Time under control.</p>
        </div>
      </footer>
    </div>
  )
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.q} className="glass rounded-2xl p-4 group">
          <summary className="cursor-pointer font-medium list-none flex justify-between gap-3">
            <span>{faq.q}</span>
            <span aria-hidden="true" className="text-watchman-muted group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="mt-3 text-sm text-watchman-text-secondary leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  )
}

/** FAQPage structured data. Built only from our own copy. */
export function FaqJsonLd({ faqs }: { faqs: Faq[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
  return (
    <script
      type="application/ld+json"
      // The content is static copy from this repo, escaped for a script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function SignupBand({ text }: { text: string }) {
  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-8 text-center">
      <p className="text-lg sm:text-xl font-semibold">{text}</p>
      <p className="mt-2 text-sm text-watchman-muted">Free plan, no card needed. Plan three months ahead free, or upgrade to Pro for more.</p>
      <Link
        href="/login?mode=signup"
        className="mt-5 inline-flex items-center justify-center px-6 min-h-[44px] rounded-xl bg-watchman-accent hover:bg-watchman-accent-hover text-white font-medium"
      >
        Create your free calendar
      </Link>
    </div>
  )
}
