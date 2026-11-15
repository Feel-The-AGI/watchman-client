import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuideShell, SignupBand } from '@/components/marketing/GuideShell'
import { AUDIENCES, audienceBySlug, scheduleBySlug } from '@/lib/schedule-library'

export const dynamicParams = false

export function generateStaticParams() {
  return AUDIENCES.map((audience) => ({ slug: audience.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const audience = audienceBySlug(slug)
  if (!audience) return {}
  const title = `${audience.title} | Watchman`
  const description = `${audience.summary} A calendar built from your rotation, with leave, notes and a chat assistant. Free to start.`
  const url = `/for/${audience.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

const FEATURES = [
  { title: 'Your rotation becomes a calendar', text: 'Pick or type your pattern once, and every day shift, night shift and day off is filled in for you.' },
  { title: 'Changes start from a date', text: 'Tell the assistant your roster changes from next month. It changes the calendar from that date and leaves the days you already worked alone. Undo is one tap.' },
  { title: 'Leave on every plan', text: 'Book annual or sick leave on any dates and see what you are back on afterwards.' },
  { title: 'Notes and incident logs', text: 'Record hours, overtime, and anything that happened on a shift, with the date attached.' },
  { title: 'Share with family (Pro)', text: 'Send a read-only link so the people at home can see when you are on without asking.' },
]

export default async function AudiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const audience = audienceBySlug(slug)
  if (!audience) notFound()
  const schedules = audience.scheduleSlugs.map((s) => scheduleBySlug(s)).filter((s) => s !== undefined)

  return (
    <GuideShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{audience.title}</h1>
        <p className="mt-3 text-lg text-watchman-text-secondary">{audience.summary}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup" className="inline-flex items-center justify-center px-6 min-h-[44px] rounded-xl bg-watchman-accent hover:bg-watchman-accent-hover text-white font-medium">
            Start free
          </Link>
          <Link href="/tools/shift-calculator" className="inline-flex items-center justify-center px-6 min-h-[44px] rounded-xl border border-watchman-border hover:bg-white/5">
            Try the shift calculator
          </Link>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">The problem with shift calendars for {audience.audience}</h2>
        <ul className="space-y-3">
          {audience.pains.map((pain) => (
            <li key={pain} className="glass rounded-2xl p-4 text-watchman-text-secondary">{pain}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">How Watchman helps</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="glass rounded-2xl p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-watchman-text-secondary">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Rotations {audience.audience} often work</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {schedules.map((schedule) => (
            <li key={schedule.slug}>
              <Link href={`/schedules/${schedule.slug}`} className="glass rounded-2xl p-4 block hover:bg-white/5 h-full">
                <span className="font-medium">{schedule.name}</span>
                <span className="block mt-1 text-sm text-watchman-muted">{schedule.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <SignupBand text={`Built for ${audience.audience} whose week is never the same twice.`} />
      </div>
    </GuideShell>
  )
}
