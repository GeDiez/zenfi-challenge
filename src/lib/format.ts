// Constructed once at module scope: a new Intl formatter per render is a real
// cost, and it is how two screens end up disagreeing on how a peso looks.
const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const PERCENT = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  maximumFractionDigits: 0,
})

/** Full peso amount, no cents: $1,284,000 */
export function currency(value: number): string {
  return MXN.format(value)
}

/** Share of a total, already normalised to 0–1. */
export function share(part: number, total: number): string {
  if (total === 0) return PERCENT.format(0)
  return PERCENT.format(part / total)
}

const DAY_MONTH = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
})

/**
 * Formats a plain `YYYY-MM-DD` date.
 *
 * The components are passed to the Date constructor individually on purpose:
 * `new Date('2026-08-02')` is parsed as UTC midnight, so any timezone west of
 * UTC renders it as the 1st. Building it from local components keeps the day
 * the one that was written.
 */
export function shortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return DAY_MONTH.format(new Date(year, month - 1, day))
}
