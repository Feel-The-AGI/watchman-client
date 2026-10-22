export const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

export interface MiniCell {
  key: string
  date: string | null
}

/** Monday-first mini month, padded to six weeks so every card is the same height. */
export function monthMiniCells(year: number, monthIndex: number): MiniCell[] {
  const first = new Date(year, monthIndex, 1)
  const leading = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: MiniCell[] = []
  for (let index = 0; index < leading; index += 1) {
    cells.push({ key: `lead-${year}-${monthIndex}-${index}`, date: null })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ key: date, date })
  }
  while (cells.length < 42) {
    cells.push({ key: `pad-${year}-${monthIndex}-${cells.length}`, date: null })
  }
  return cells
}
