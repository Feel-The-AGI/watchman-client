import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShiftCalculator } from '@/components/tools/ShiftCalculator'
import { FaqJsonLd, FaqList, GuideShell, SignupBand } from '@/components/marketing/GuideShell'
import { totalCycleDays } from '@/lib/rotation'
import { AUDIENCES, SCHEDULES, scheduleBySlug } from '@/lib/schedule-library'
import { averageWeeklyHours, describePattern } from '@/lib/shift-calculator'

export const dynamicParams = false

export function generateStaticParams() {
  return SCHEDULES.map((schedule) => ({ slug: schedule.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const schedule = scheduleBySlug(slug)
  if (!schedule) return {}
  const title = `${schedule.name}: how it works, hours and free calendar | Watchman`
  const description = `${schedule.summary} Average ${averageWeeklyHours(schedule.pattern, schedule.shiftHours)} hours a week. See your own dates with the free calculator.`
  const url = `/schedules/${schedule.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const schedule = scheduleBySlug(slug)
  if (!schedule) notFound()
  const cycle = totalCycleDays(schedule.pattern)
  const weekly = averageWeeklyHours(schedule.pattern, schedule.shiftHours)
  const audiences = AUDIENCES.filter((audience) => audience.scheduleSlugs.includes(schedule.slug))
  const related = SCHEDULES.filter((other) => other.slug !== schedule.slug).slice(0, 6)

  return (
    <GuideShell>
      <FaqJsonLd faqs={schedule.faqs} />
      <nav aria-label="Breadcrumb" className="text-sm text-watchman-muted">
        <Link href="/schedules" className="hover:text-white">Shift schedules</Link> / <span>{schedule.short}</span>
      </nav>
      <div className="max-w-3xl mt-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{schedule.name}</h1>
        <p className="mt-3 text-watchman-text-secondary">{schedule.summary}</p>
      </div>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <dt className="text-xs text-watchman-muted">Cycle</dt>
          <dd className="mt-1 font-semibold">{cycle} days</dd>
        </div>
        <div className="glass rounded-2xl p-4">
          <dt className="text-xs text-watchman-muted">Pattern</dt>
          <dd className="mt-1 font-semibold text-sm">{describePattern(schedule.pattern)}</dd>
        </div>
        <div className="glass rounded-2xl p-4">
          <dt className="text-xs text-watchman-muted">Average week</dt>
          <dd className="mt-1 font-semibold">{weekly} hours on {schedule.shiftHours}-hour shifts</dd>
        </div>
      </dl>

      <section className="mt-10 max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        {schedule.howItWorks.map((paragraph) => (
          <p key={paragraph} className="text-watchman-text-secondary leading-relaxed">{paragraph}</p>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Your {schedule.short} calendar</h2>
        <p className="text-sm text-watchman-muted mb-5">Enter one date you know and which day of the cycle it is.</p>
        <ShiftCalculator presetSlug={schedule.slug} />
      </section>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Who uses it</h2>
          <ul className="space-y-1.5 text-sm text-watchman-text-secondary list-disc pl-5">
            {schedule.whoUses.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Pros</h2>
          <ul className="space-y-1.5 text-sm text-watchman-text-secondary list-disc pl-5">
            {schedule.pros.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Cons</h2>
          <ul className="space-y-1.5 text-sm text-watchman-text-secondary list-disc pl-5">
            {schedule.cons.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Questions about the {schedule.short} schedule</h2>
        <FaqList faqs={schedule.faqs} />
      </section>

      {audiences.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Watchman for</h2>
          <ul className="flex flex-wrap gap-3">
            {audiences.map((audience) => (
              <li key={audience.slug}>
                <Link href={`/for/${audience.slug}`} className="glass rounded-xl px-4 min-h-[44px] inline-flex items-center hover:bg-white/5 text-sm">
                  {audience.audience}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Other rotations</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {related.map((other) => (
            <li key={other.slug}>
              <Link href={`/schedules/${other.slug}`} className="glass rounded-2xl p-4 block hover:bg-white/5 h-full">
                <span className="font-medium">{other.name}</span>
                <span className="block mt-1 text-sm text-watchman-muted">{other.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <SignupBand text={`Keep your ${schedule.short} rotation on your phone, with leave and notes.`} />
      </div>
    </GuideShell>
  )
}
