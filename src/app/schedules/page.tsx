import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideShell, SignupBand } from '@/components/marketing/GuideShell'
import { totalCycleDays } from '@/lib/rotation'
import { AUDIENCES, SCHEDULES } from '@/lib/schedule-library'
import { averageWeeklyHours } from '@/lib/shift-calculator'

const TITLE = 'Shift schedules explained: 4 on 4 off, DuPont, 2-2-3, 24/48 and FIFO | Watchman'
const DESCRIPTION =
  'How the common 12-hour, 24-hour and FIFO shift rotations work: cycle length, average weekly hours, pros and cons, with a free calendar for each.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/schedules' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/schedules', type: 'website' },
}

export default function SchedulesPage() {
  return (
    <GuideShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Shift schedules explained</h1>
        <p className="mt-3 text-watchman-text-secondary">
          How each rotation works, how many hours it averages, and a calendar you can set to your own start date.
        </p>
      </div>
      <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCHEDULES.map((schedule) => (
          <li key={schedule.slug}>
            <Link href={`/schedules/${schedule.slug}`} className="glass rounded-2xl p-5 block hover:bg-white/5 h-full">
              <h2 className="font-semibold text-lg">{schedule.name}</h2>
              <p className="mt-1 text-sm text-watchman-text-secondary">{schedule.summary}</p>
              <p className="mt-3 text-xs text-watchman-muted">
                {totalCycleDays(schedule.pattern)}-day cycle · {averageWeeklyHours(schedule.pattern, schedule.shiftHours)} hours a week on {schedule.shiftHours}-hour shifts
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">By job</h2>
        <ul className="flex flex-wrap gap-3">
          {AUDIENCES.map((audience) => (
            <li key={audience.slug}>
              <Link href={`/for/${audience.slug}`} className="glass rounded-xl px-4 min-h-[44px] inline-flex items-center hover:bg-white/5 text-sm">
                {audience.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-12">
        <SignupBand text="Can't find your rotation? Build it in the calculator or type it into Watchman." />
      </div>
    </GuideShell>
  )
}
