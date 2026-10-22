/** Missing hours are not zero. Zero is a logged value. */
export function actualHoursText(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not logged'
  return `${value}h`
}

export function hoursWereLogged(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value)
}
