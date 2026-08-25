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

/** A share already normalised to 0–1. */
export function percent(value: number): string {
  return PERCENT.format(value)
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

const MONTH_YEAR = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric',
})

/**
 * Turns a `YYYY-MM` period into "agosto de 2026".
 *
 * Built from local components rather than `new Date('2026-08')`, which parses
 * as UTC midnight and can render the previous month west of UTC.
 */
export function monthLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return MONTH_YEAR.format(new Date(year, month - 1, 1))
}

const MONTH_ONLY = new Intl.DateTimeFormat('es-MX', { month: 'long' })

/**
 * Just the month name from a `YYYY-MM` period: "agosto".
 *
 * Always derived from the data's own period, never from the clock. A title
 * built from `new Date()` would read "septiembre" over August figures the
 * moment the month turns.
 */
export function monthName(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return MONTH_ONLY.format(new Date(year, month - 1, 1))
}

const COMPACT = new Intl.NumberFormat('es-MX', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/**
 * Compact peso amount for axis ticks and chart labels, where the exact figure
 * is carried by the tooltip and the table view.
 */
export function currencyCompact(value: number): string {
  return `$${COMPACT.format(value)}`
}
