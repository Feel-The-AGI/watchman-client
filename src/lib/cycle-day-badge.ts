export type ShiftWorkType = 'work_day' | 'work_night' | 'off' | 'blank' | string | null | undefined

/**
 * Badge for a calendar cell. The number is the real cycle day (D13, not D3).
 * Off days stay OFF. A 5-day modulo was collapsing 14-day blocks into D1–D5.
 */
export function cycleDayBadge(workType: ShiftWorkType, cycleDay: number | null | undefined): string | null {
  if (!cycleDay || cycleDay < 1 || !workType || workType === 'blank') return null
  if (workType === 'off') return 'OFF'
  if (workType === 'work_night') return `N${cycleDay}`
  if (workType === 'work_day') return `D${cycleDay}`
  return null
}
