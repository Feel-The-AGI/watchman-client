import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))
  return eachDayOfInterval({ start, end })
}

export function getWorkTypeColor(workType: string): string {
  switch (workType) {
    case 'work_day':
      return 'bg-work-day/20 border-l-work-day'
    case 'work_night':
      return 'bg-work-night/20 border-l-work-night'
    case 'off':
      return 'bg-work-off/20 border-l-work-off'
    default:
      return 'bg-watchman-surface'
  }
}

export function getWorkTypeBadgeColor(workType: string): string {
  switch (workType) {
    case 'work_day':
      return 'bg-work-day text-white'
    case 'work_night':
      return 'bg-work-night text-white'
    case 'off':
      return 'bg-work-off text-white'
    default:
      return 'bg-watchman-muted text-white'
  }
}

export function getCommitmentColor(type: string): string {
  switch (type) {
    case 'education':
    case 'study':
      return 'bg-commit-education'
    case 'personal':
      return 'bg-commit-personal'
    case 'leave':
      return 'bg-commit-leave'
    default:
      return 'bg-watchman-accent'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-watchman-success'
    case 'queued':
      return 'text-watchman-warning'
    case 'completed':
      return 'text-watchman-muted'
    case 'paused':
      return 'text-watchman-muted'
    default:
      return 'text-watchman-text'
  }
}

export function getMutationStatusColor(status: string): string {
  switch (status) {
    case 'proposed':
      return 'text-watchman-warning bg-watchman-warning/10'
    case 'approved':
      return 'text-watchman-success bg-watchman-success/10'
    case 'rejected':
      return 'text-watchman-error bg-watchman-error/10'
    default:
      return 'text-watchman-muted'
  }
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
