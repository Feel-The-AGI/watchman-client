'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Link2, Minus, Plus } from 'lucide-react'
import { totalCycleDays, type CycleBlock, type ShiftLabel } from '@/lib/rotation'
import {
  CALCULATOR_HANDOFF_KEY,
  MAX_CALCULATOR_CYCLE,
  averageWeeklyHours,
  buildMonths,
  calculatorQuery,
  describePattern,
  encodePattern,
  isoDate,
  nextShift,
  rotationFromQuery,
  shiftOn,
  writeHandoff,
  type RotationAnchor,
} from '@/lib/shift-calculator'
import { SCHEDULES } from '@/lib/schedule-library'
import { cn } from '@/lib/utils'

const SHIFT_NAMES: Record<ShiftLabel, string> = {
  work_day: 'Day shift',
  work_night: 'Night shift',
  off: 'Off',
}

const SHIFT_LETTER: Record<ShiftLabel, string> = { work_day: 'D', work_night: 'N', off: 'O' }

const SHIFT_CELL: Record<ShiftLabel, string> = {
  work_day: 'bg-work-day/20 text-work-day border-work-day/30',
  work_night: 'bg-work-night/25 text-indigo-200 border-work-night/40',
  off: 'bg-work-off/15 text-work-off border-work-off/25',
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function longDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function parseInputDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return isoDate(date) === value ? date : null
}

interface ShiftCalculatorProps {
  /** Preset to start from, by schedule slug. Defaults to 4 on 4 off. */
  presetSlug?: string
  /** Keep the address bar in step so the page can be shared. Only on the main tool page. */
  syncUrl?: boolean
}

export function ShiftCalculator({ presetSlug, syncUrl = false }: ShiftCalculatorProps) {
  const preset = SCHEDULES.find((schedule) => schedule.slug === presetSlug) ?? SCHEDULES[0]
  const [today, setToday] = useState<Date | null>(null)
  const [pattern, setPattern] = useState<CycleBlock[]>(preset.pattern)
  const [anchorDate, setAnchorDate] = useState('')
  const [anchorCycleDay, setAnchorCycleDay] = useState(1)
  const [shiftHours, setShiftHours] = useState<number>(preset.shiftHours)
  const [lookupDate, setLookupDate] = useState('')
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')

  // Dates depend on the visitor's clock, so they are set after the page loads.
  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    setToday(start)
    const fallback: RotationAnchor = { pattern: preset.pattern, anchorDate: isoDate(start), anchorCycleDay: 1 }
    if (syncUrl) {
      const read = rotationFromQuery(new URLSearchParams(window.location.search), fallback)
      setPattern(read.rotation.pattern)
      setAnchorDate(read.rotation.anchorDate)
      setAnchorCycleDay(read.rotation.anchorCycleDay)
      if (read.shiftHours) setShiftHours(read.shiftHours)
    } else {
      setAnchorDate(fallback.anchorDate)
    }
    setLookupDate(isoDate(start))
    // Read the link once, on load.
  }, [])

  const total = totalCycleDays(pattern)
  const cycleDay = Math.min(Math.max(1, anchorCycleDay), Math.max(1, total))
  const rotation: RotationAnchor | null =
    anchorDate && total > 0 ? { pattern, anchorDate, anchorCycleDay: cycleDay } : null

  useEffect(() => {
    if (!syncUrl || !anchorDate || total < 1) return
    const query = calculatorQuery({ pattern, anchorDate, anchorCycleDay: cycleDay }, shiftHours)
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
  }, [syncUrl, pattern, anchorDate, cycleDay, total, shiftHours])

  const months = useMemo(
    () => (rotation && today ? buildMonths(rotation, today, 3, today) : []),
    // rotation is rebuilt every render; its parts are the real inputs.
    [pattern, anchorDate, cycleDay, today],
  )

  const matchingPreset = SCHEDULES.find((schedule) => encodePattern(schedule.pattern) === encodePattern(pattern))
  const weekly = averageWeeklyHours(pattern, shiftHours)
  // "Next" means after today; today has its own card.
  const tomorrow = today ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) : null
  const nextOff = rotation && tomorrow ? nextShift(rotation, tomorrow, 'off') : null
  const nextNight = rotation && tomorrow ? nextShift(rotation, tomorrow, 'work_night') : null
  const nextDay = rotation && tomorrow ? nextShift(rotation, tomorrow, 'work_day') : null
  const lookup = parseInputDate(lookupDate)
  const lookupShift = rotation && lookup ? shiftOn(rotation, lookup) : null
  const hasNights = pattern.some((block) => block.label === 'work_night')

  const choosePreset = (slug: string) => {
    const chosen = SCHEDULES.find((schedule) => schedule.slug === slug)
    if (!chosen) return
    setPattern(chosen.pattern)
    setShiftHours(chosen.shiftHours)
    setAnchorCycleDay(1)
  }

  const updateBlock = (index: number, change: Partial<CycleBlock>) => {
    setPattern((current) => {
      const next = current.map((block, i) => (i === index ? { ...block, ...change } : block))
      return totalCycleDays(next) <= MAX_CALCULATOR_CYCLE ? next : current
    })
  }

  const addBlock = () => {
    setPattern((current) =>
      current.length >= 40 || totalCycleDays(current) + 1 > MAX_CALCULATOR_CYCLE
        ? current
        : [...current, { label: 'off', duration: 1 }],
    )
  }

  const removeBlock = (index: number) => {
    setPattern((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)))
  }

  const copyLink = async () => {
    if (!rotation) return
    const url = `${window.location.origin}/tools/shift-calculator?${calculatorQuery(rotation, shiftHours)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied('copied')
    } catch {
      setCopied('failed')
    }
    setTimeout(() => setCopied('idle'), 2500)
  }

  const saveForSignup = () => {
    try {
      window.localStorage.setItem(CALCULATOR_HANDOFF_KEY, writeHandoff(pattern))
    } catch {
      // Private browsing: the visitor picks the rotation again during setup.
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4 sm:p-6 space-y-5">
        <div>
          <label htmlFor="calc-preset" className="block text-sm font-medium mb-2">Rotation</label>
          <select
            id="calc-preset"
            value={matchingPreset?.slug ?? 'custom'}
            onChange={(event) => choosePreset(event.target.value)}
            className="w-full px-3 py-3 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm"
          >
            {SCHEDULES.map((schedule) => (
              <option key={schedule.slug} value={schedule.slug}>{schedule.name}</option>
            ))}
            <option value="custom" disabled={Boolean(matchingPreset)}>Custom (edit the blocks below)</option>
          </select>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium mb-2">Blocks, in order</legend>
          <ul className="space-y-2">
            {pattern.map((block, index) => (
              <li key={index} className="flex items-center gap-2">
                <select
                  aria-label={`Block ${index + 1} type`}
                  value={block.label}
                  onChange={(event) => updateBlock(index, { label: event.target.value as ShiftLabel })}
                  className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm"
                >
                  <option value="work_day">Day shifts</option>
                  <option value="work_night">Night shifts</option>
                  <option value="off">Days off</option>
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CALCULATOR_CYCLE}
                  aria-label={`Block ${index + 1} number of days`}
                  value={block.duration}
                  onChange={(event) => {
                    const value = Math.trunc(Number(event.target.value))
                    if (Number.isFinite(value) && value >= 1) updateBlock(index, { duration: value })
                  }}
                  className="w-20 shrink-0 px-3 py-2.5 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm text-center"
                />
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  disabled={pattern.length <= 1}
                  aria-label={`Remove block ${index + 1}`}
                  className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-xl border border-watchman-border text-watchman-muted hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={addBlock}
              className="inline-flex items-center gap-2 px-3 min-h-[40px] rounded-xl border border-watchman-border text-sm hover:bg-white/5"
            >
              <Plus className="w-4 h-4" /> Add block
            </button>
            <p className="text-sm text-watchman-muted">
              {total}-day cycle: {describePattern(pattern)}
            </p>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="calc-anchor" className="block text-sm font-medium mb-2">A date you know</label>
            <input
              id="calc-anchor"
              type="date"
              value={anchorDate}
              onChange={(event) => parseInputDate(event.target.value) && setAnchorDate(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label htmlFor="calc-day" className="block text-sm font-medium mb-2">Is day … of the cycle</label>
            <input
              id="calc-day"
              type="number"
              inputMode="numeric"
              min={1}
              max={total}
              value={cycleDay}
              onChange={(event) => {
                const value = Math.trunc(Number(event.target.value))
                if (Number.isFinite(value) && value >= 1 && value <= total) setAnchorCycleDay(value)
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm"
            />
          </div>
          <div>
            <label htmlFor="calc-hours" className="block text-sm font-medium mb-2">Shift length (hours)</label>
            <input
              id="calc-hours"
              type="number"
              inputMode="decimal"
              min={1}
              max={24}
              step={0.5}
              value={shiftHours}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (Number.isFinite(value) && value > 0 && value <= 24) setShiftHours(value)
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-watchman-muted">
          Cycle day 1 is the first day of the first block. For example, the first of four day shifts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-live="polite">
        <Stat label="Today" value={today && rotation ? SHIFT_NAMES[shiftOn(rotation, today) ?? 'off'] : '…'} />
        <Stat label="Next day off" value={nextOff ? longDate(nextOff) : '…'} />
        <Stat
          label={hasNights ? 'Next night shift' : 'Next shift'}
          value={(hasNights ? nextNight : nextDay) ? longDate((hasNights ? nextNight : nextDay)!) : '…'}
        />
        <Stat label="Average week" value={weekly !== null ? `${weekly} hours` : '…'} />
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        <label htmlFor="calc-lookup" className="block text-sm font-medium mb-2">Am I working on…</label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            id="calc-lookup"
            type="date"
            value={lookupDate}
            onChange={(event) => setLookupDate(event.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-watchman-surface border border-watchman-border focus:border-watchman-accent focus:outline-none text-sm"
          />
          <p className="text-sm" aria-live="polite">
            {lookup && lookupShift
              ? `${longDate(lookup)}: ${lookupShift === 'off' ? 'day off' : SHIFT_NAMES[lookupShift].toLowerCase()}.`
              : 'Pick a date.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-watchman-muted" aria-label="Legend">
        {(['work_day', 'work_night', 'off'] as ShiftLabel[]).map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={cn('inline-flex w-5 h-5 items-center justify-center rounded border text-[10px] font-semibold', SHIFT_CELL[label])}>
              {SHIFT_LETTER[label]}
            </span>
            {SHIFT_NAMES[label]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-5 h-5 rounded ring-2 ring-watchman-accent" /> Today
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {months.length === 0
          ? [0, 1, 2].map((key) => <div key={key} className="glass rounded-2xl h-72 animate-pulse" />)
          : months.map((month) => (
              <section key={month.label} className="glass rounded-2xl p-3 sm:p-4" aria-label={month.label}>
                <h3 className="font-semibold mb-3">{month.label}</h3>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-watchman-muted mb-1">
                  {WEEKDAYS.map((day) => <span key={day}>{day.slice(0, 2)}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {month.cells.map((cell) =>
                    cell.day === null || !cell.shift ? (
                      <span key={cell.key} aria-hidden="true" />
                    ) : (
                      <span
                        key={cell.key}
                        title={`${cell.iso}: ${SHIFT_NAMES[cell.shift]}`}
                        className={cn(
                          'aspect-square min-w-0 rounded-md border flex flex-col items-center justify-center leading-none',
                          SHIFT_CELL[cell.shift],
                          cell.isToday && 'ring-2 ring-watchman-accent',
                        )}
                      >
                        <span className="text-[11px] sm:text-xs text-white/80">{cell.day}</span>
                        <span className="text-[9px] sm:text-[10px] font-semibold mt-0.5">{SHIFT_LETTER[cell.shift]}</span>
                        <span className="sr-only">{SHIFT_NAMES[cell.shift]}</span>
                      </span>
                    ),
                  )}
                </div>
                <p className="mt-3 text-xs text-watchman-muted">
                  {month.totals.days} days · {month.totals.nights} nights · {month.totals.off} off
                  {` · ${Math.round((month.totals.days + month.totals.nights) * shiftHours * 10) / 10} hours`}
                </p>
              </section>
            ))}
      </div>

      <div className="glass-strong rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <p className="font-semibold">Keep this rotation on your phone</p>
          <p className="text-sm text-watchman-muted mt-1">
            Watchman turns it into a full calendar, with leave, notes and a chat assistant that changes your roster from a date forward. Free plan, no card needed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-xl border border-watchman-border text-sm hover:bg-white/5 whitespace-nowrap"
          >
            {copied === 'copied' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {copied === 'copied' ? 'Link copied' : copied === 'failed' ? 'Copy failed: use the address bar' : 'Copy link'}
          </button>
          <Link
            href="/login?mode=signup&from=calculator"
            onClick={saveForSignup}
            className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-xl bg-watchman-accent hover:bg-watchman-accent-hover text-white text-sm font-medium whitespace-nowrap"
          >
            Save this rotation to Watchman — free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 min-w-0">
      <p className="text-xs text-watchman-muted">{label}</p>
      <p className="mt-1 font-semibold text-sm break-words">{value}</p>
    </div>
  )
}
