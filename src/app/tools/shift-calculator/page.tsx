import type { Metadata } from 'next'
import Link from 'next/link'
import { ShiftCalculator } from '@/components/tools/ShiftCalculator'
import { FaqJsonLd, FaqList, GuideShell } from '@/components/marketing/GuideShell'
import { SCHEDULES, type Faq } from '@/lib/schedule-library'

const TITLE = 'Free shift rotation calculator | Watchman'
const DESCRIPTION =
  'See your next three months of day shifts, night shifts and days off for any rotation: 4 on 4 off, DuPont, 2-2-3, 24/48, FIFO rosters or your own pattern.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/tools/shift-calculator' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/tools/shift-calculator', type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

const FAQS: Faq[] = [
  { q: 'How does the shift calculator work?', a: 'Choose your rotation or build it from blocks of day shifts, night shifts and days off. Enter one date you know and which day of the cycle it is. The calculator counts forward and back from that date to fill in every other day.' },
  { q: 'What is a cycle day?', a: 'Your rotation repeats every few days. Cycle day 1 is the first day of the first block, for example the first of four day shifts. If today is your second night shift in a 2 days, 2 nights, 4 off pattern, today is cycle day 4.' },
  { q: 'Can I share my rotation?', a: 'Yes. The address of this page updates as you change the rotation, so Copy link gives anyone the same calendar.' },
  { q: 'Is the calculator free?', a: 'Yes, and it runs in your browser. Nothing you enter here is sent to our servers unless you create an account and save it.' },
  { q: 'What does Watchman add?', a: 'A saved calendar you can open on any device, leave booking, notes and incident logs per day, and a chat assistant that changes your roster from a date forward without touching the days you already worked.' },
]

export default function ShiftCalculatorPage() {
  return (
    <GuideShell>
      <FaqJsonLd faqs={FAQS} />
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Shift rotation calculator</h1>
        <p className="mt-3 text-watchman-text-secondary">
          Pick your rotation, enter one shift you know, and see which days you work for the next three months.
        </p>
      </div>
      <div className="mt-8">
        <ShiftCalculator syncUrl />
      </div>
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Common rotations</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCHEDULES.map((schedule) => (
            <li key={schedule.slug}>
              <Link href={`/schedules/${schedule.slug}`} className="glass rounded-2xl p-4 block hover:bg-white/5 h-full">
                <span className="font-medium">{schedule.name}</span>
                <span className="block mt-1 text-sm text-watchman-muted">{schedule.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <FaqList faqs={FAQS} />
      </section>
    </GuideShell>
  )
}
