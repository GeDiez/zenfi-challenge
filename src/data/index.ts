import {
  formatTransactions,
  type RawExport,
  type Transaction,
} from './formatTransactions'
import rawExport from './transactions.json'

/**
 * The single entry point for expense data. Everything downstream imports from
 * here and never from the raw JSON, so the cleaning rules cannot be bypassed.
 *
 * The formatter runs once at module scope: it is pure and the input is static,
 * so re-running it per render would only burn work.
 */
const result = formatTransactions(rawExport as RawExport)

export type {
  Transaction,
  TransactionState,
  FlowType,
  Discarded,
  DiscardReason,
} from './formatTransactions'
export { UNCATEGORISED_ID, UNCATEGORISED_LABEL } from './formatTransactions'

export const PERIOD = result.period
export const GENERATED_AT = result.generatedAt

/** Consumption only — see `formatTransactions` for what that excludes. */
export const TRANSACTIONS = result.transactions

/** Income and transfers: real money, but not spending. */
export const EXCLUDED_FLOWS = result.excludedFlows

/** Every row the cleaning dropped, with the reason. Surfaced, never hidden. */
export const DISCARDED = result.discarded

/** Things that need a human decision; nothing here was auto-corrected. */
export const WARNINGS = result.warnings

export type CategoryTotal = {
  id: string
  label: string
  amount: number
  /** Share of the month's spending, 0–1. */
  share: number
  count: number
}

const totalsById = new Map<string, CategoryTotal>()
for (const tx of TRANSACTIONS) {
  const current = totalsById.get(tx.categoryId)
  if (current === undefined) {
    totalsById.set(tx.categoryId, {
      id: tx.categoryId,
      label: tx.categoryLabel,
      amount: tx.amount,
      share: 0,
      count: 1,
    })
  } else {
    current.amount += tx.amount
    current.count += 1
  }
}

export const MONTHLY_TOTAL = TRANSACTIONS.reduce(
  (acc, tx) => acc + tx.amount,
  0,
)

/** Every credit that landed this period: payroll, refunds, reimbursements. */
export const INCOME_TRANSACTIONS = EXCLUDED_FLOWS.filter(
  (tx) => tx.flow === 'income',
)

export const MONTHLY_INCOME = INCOME_TRANSACTIONS.reduce(
  (acc, tx) => acc + tx.amount,
  0,
)

/**
 * Spending as a share of income, 0–1. Above 1 means the month spent more than
 * it earned — worth stating plainly rather than leaving to be computed.
 */
export const SPEND_RATIO =
  MONTHLY_INCOME === 0 ? null : MONTHLY_TOTAL / MONTHLY_INCOME

/** Ordered by spend, descending. */
export const CATEGORY_TOTALS: CategoryTotal[] = [...totalsById.values()]
  .map((entry) => ({
    ...entry,
    share: MONTHLY_TOTAL === 0 ? 0 : entry.amount / MONTHLY_TOTAL,
  }))
  .sort((a, b) => b.amount - a.amount)

/**
 * The four categories the hero features.
 *
 * This list is FIXED, not recomputed from the current ranking. Deriving it from
 * rank would repaint the cards whenever one category overtakes another, and a
 * reader who learned "vivienda is blue" would be misled the following month.
 * These four were the top of this dataset and they account for 89% of it; when
 * the data changes enough to justify a different four, change this list on
 * purpose.
 */
export const FEATURED_CATEGORY_IDS = [
  'vivienda',
  'supermercado',
  'compras',
  'comida',
] as const

export const FEATURED_CATEGORIES: CategoryTotal[] = FEATURED_CATEGORY_IDS.map(
  (id) =>
    CATEGORY_TOTALS.find((entry) => entry.id === id) ?? {
      id,
      label: id,
      amount: 0,
      share: 0,
      count: 0,
    },
)

export type AccountTotal = {
  id: string
  label: string
  amount: number
  count: number
}

/** Sentinel for a charge whose source account the export did not record. */
export const UNKNOWN_ACCOUNT_ID = 'sin-cuenta'

/**
 * The accounts this period actually shows, derived from the data. A month with
 * three cards yields three options; the list is never hardcoded.
 */
export const ACCOUNT_TOTALS: AccountTotal[] = (() => {
  const byId = new Map<string, AccountTotal>()
  for (const tx of TRANSACTIONS) {
    const id = tx.account ?? UNKNOWN_ACCOUNT_ID
    const label = tx.account ?? 'Sin cuenta'
    const current = byId.get(id)
    if (current === undefined) {
      byId.set(id, { id, label, amount: tx.amount, count: 1 })
    } else {
      current.amount += tx.amount
      current.count += 1
    }
  }
  return [...byId.values()].sort((a, b) => b.amount - a.amount)
})()

export type DailyTotal = {
  /** `YYYY-MM-DD`. */
  date: string
  /** Day of the month, for the axis. */
  day: number
  amount: number
}

/**
 * Spending per day, covering only the days the export actually describes.
 *
 * The range stops at the last day with data rather than running to the end of
 * the month: drawing 20–31 August as zero would claim nothing was spent, when
 * the truth is nothing is known yet. A gap and a zero are different statements.
 *
 * Days inside the range with no charges DO get a zero, because there the export
 * does cover them and zero is the honest value.
 */
export function buildDailyTotals(source: Transaction[]): DailyTotal[] {
  if (source.length === 0) return []

  const byDate = new Map<string, number>()
  for (const tx of source) {
    byDate.set(tx.date, (byDate.get(tx.date) ?? 0) + tx.amount)
  }

  const dates = [...byDate.keys()].sort()
  const firstDay = Number(dates[0].slice(8, 10))
  const lastDay = Number(dates[dates.length - 1].slice(8, 10))
  const prefix = dates[0].slice(0, 8)

  const out: DailyTotal[] = []
  for (let day = firstDay; day <= lastDay; day += 1) {
    const date = prefix + String(day).padStart(2, '0')
    out.push({ date, day, amount: byDate.get(date) ?? 0 })
  }
  return out
}

export const DAILY_TOTALS: DailyTotal[] = buildDailyTotals(TRANSACTIONS)

export function extremeDay(
  daily: DailyTotal[],
  pick: 'max' | 'min',
): DailyTotal | null {
  if (daily.length === 0) return null
  return daily.reduce((best, current) =>
    pick === 'max'
      ? current.amount > best.amount
        ? current
        : best
      : current.amount < best.amount
        ? current
        : best,
  )
}

export const PEAK_DAY = extremeDay(DAILY_TOTALS, 'max')
export const LOWEST_DAY = extremeDay(DAILY_TOTALS, 'min')

/** The single largest charge on a given day — what explains a spike. */
export function largestChargeOn(
  source: Transaction[],
  date: string,
): Transaction | null {
  return (
    source
      .filter((tx) => tx.date === date)
      .sort((a, b) => b.amount - a.amount)[0] ?? null
  )
}

/**
 * The single largest charge on the peak day, so the spike can be explained
 * instead of merely pointed at. Derived, never hardcoded.
 */
export const PEAK_DAY_DRIVER =
  PEAK_DAY === null ? null : largestChargeOn(TRANSACTIONS, PEAK_DAY.date)

export type RecurringSpend = {
  description: string
  count: number
  total: number
}

/**
 * The charge that shows up most often — the habit, not the headline.
 *
 * Ranked by how many times it appears, with the total as the tie-break. A
 * merchant seen five times says more about a routine than one big purchase
 * does, which is why this is counted by occurrence and not by amount.
 */
export const MOST_RECURRING: RecurringSpend | null = (() => {
  const byDescription = new Map<string, RecurringSpend>()
  for (const tx of TRANSACTIONS) {
    const current = byDescription.get(tx.description)
    if (current === undefined) {
      byDescription.set(tx.description, {
        description: tx.description,
        count: 1,
        total: tx.amount,
      })
    } else {
      current.count += 1
      current.total += tx.amount
    }
  }

  const ranked = [...byDescription.values()].sort(
    (a, b) => b.count - a.count || b.total - a.total,
  )
  const top = ranked[0]
  // One occurrence is not a habit; with nothing repeating there is nothing to
  // report, and claiming otherwise would dress a single charge as a pattern.
  return top === undefined || top.count < 2 ? null : top
})()

/** The single largest charge of the period. */
export const LARGEST_CHARGE: Transaction | null =
  [...TRANSACTIONS].sort((a, b) => b.amount - a.amount)[0] ?? null

/**
 * Income minus spending. Negative means the period spent more than it earned —
 * stated plainly rather than hidden behind an absolute value.
 *
 * Both sides come from the same window, so the comparison is internally
 * consistent even though that window is shorter than a calendar month.
 */
export const NET_BALANCE = MONTHLY_INCOME - MONTHLY_TOTAL
