/**
 * Turns the raw export into data the UI can trust.
 *
 * The raw file carries eleven distinct defects — string amounts, an unreliable
 * sign, a foreign currency, empty categories, out-of-period rows, exact
 * duplicates and unsettled states. Every rule below exists because a specific
 * record in the source breaks without it, and every dropped record is reported
 * rather than silently vanishing: a total that quietly excludes rows is worse
 * than one that is visibly incomplete.
 */

export type RawTransaction = {
  id: string
  fecha: string
  descripcion: string
  monto: number | string
  moneda: string
  categoria: string | null
  cuenta: string | null
  estado: string
}

export type RawExport = {
  periodo: string
  generado_en: string
  movimientos: RawTransaction[]
}

export type TransactionState =
  'confirmada' | 'pendiente' | 'programada' | 'en_disputa'

/**
 * What the movement DOES, which is not the same as its sign.
 * - `consumption` — money left and bought something.
 * - `transfer`    — money moved without being spent (card payment, SPEI, ATM).
 * - `income`      — money arrived.
 */
export type FlowType = 'consumption' | 'transfer' | 'income'

export type Transaction = {
  id: string
  /** Calendar date as written in the source, `YYYY-MM-DD`. */
  date: string
  /** The original offset-bearing instant, kept for ordering and auditing. */
  timestamp: string
  description: string
  account: string | null
  /** Always a positive magnitude; direction lives in `flow`. */
  amount: number
  currency: string
  categoryId: string
  categoryLabel: string
  state: TransactionState
  flow: FlowType
}

export type DiscardReason =
  | 'amount-not-numeric'
  | 'amount-zero'
  | 'foreign-currency'
  | 'outside-period'
  | 'unsettled-state'
  | 'duplicate'

export type Discarded = {
  id: string
  description: string
  reason: DiscardReason
  detail: string
}

export type FormatResult = {
  period: string
  generatedAt: string
  /** Consumption only, ready to render. */
  transactions: Transaction[]
  /** Income and transfers: real, but not spending. */
  excludedFlows: Transaction[]
  discarded: Discarded[]
  /** Things a human should look at; never silently "fixed". */
  warnings: string[]
}

export const UNCATEGORISED_ID = 'sin-categoria'
export const UNCATEGORISED_LABEL = 'Sin categoría'

/** Categories that move money without consuming it. */
const TRANSFER_CATEGORIES = new Set(['Pagos', 'Transferencias', 'Efectivo'])
const INCOME_CATEGORIES = new Set(['Ingresos'])

/** A credit arriving, recognisable from the statement text. */
const INCOME_DESCRIPTION = /^(REEMBOLSO|SPEI RECIBIDO)/i

/** Most settled first — used to pick the survivor among duplicates. */
const STATE_RANK: Record<TransactionState, number> = {
  confirmada: 0,
  pendiente: 1,
  programada: 2,
  en_disputa: 3,
}

/** States that represent money actually spent this period. */
const SETTLED_STATES = new Set<TransactionState>(['confirmada'])

function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * `"1876.40"` and `-1876.4` must both land on the same number.
 * Returns null when the value cannot be read as one.
 */
function parseAmount(raw: number | string): number | null {
  const value =
    typeof raw === 'number' ? raw : Number(raw.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(value) ? value : null
}

/**
 * Direction is decided by what the movement IS, never by the sign.
 *
 * The sign in this export is demonstrably unreliable: `txn_024` (Walmart) and
 * `txn_048` (car insurance) are both stored positive and both are charges. A
 * rule that trusted the sign would drop them from the total; one that took
 * `Math.abs` of everything would turn payroll into an expense.
 */
function classifyFlow(categoria: string | null, descripcion: string): FlowType {
  if (INCOME_DESCRIPTION.test(descripcion)) return 'income'
  if (categoria !== null && INCOME_CATEGORIES.has(categoria)) return 'income'
  if (categoria !== null && TRANSFER_CATEGORIES.has(categoria))
    return 'transfer'
  return 'consumption'
}

function isKnownState(value: string): value is TransactionState {
  return value in STATE_RANK
}

export function formatTransactions(source: RawExport): FormatResult {
  const discarded: Discarded[] = []
  const warnings: string[] = []
  const normalised: Transaction[] = []

  for (const raw of source.movimientos) {
    const amount = parseAmount(raw.monto)

    if (amount === null) {
      discarded.push({
        id: raw.id,
        description: raw.descripcion,
        reason: 'amount-not-numeric',
        detail: `monto = ${JSON.stringify(raw.monto)}`,
      })
      continue
    }

    if (amount === 0) {
      discarded.push({
        id: raw.id,
        description: raw.descripcion,
        reason: 'amount-zero',
        detail: 'un movimiento de cero no aporta al total',
      })
      continue
    }

    // Summing currencies needs an exchange rate. Inventing one would be worse
    // than leaving the row out and saying so.
    if (raw.moneda !== 'MXN') {
      discarded.push({
        id: raw.id,
        description: raw.descripcion,
        reason: 'foreign-currency',
        detail: `${raw.moneda} sin tipo de cambio`,
      })
      continue
    }

    // The date is taken as written rather than parsed into a Date and
    // re-formatted: `new Date('2026-08-01T…-06:00')` is an instant, and
    // rendering it in another zone shifts the calendar day.
    const date = raw.fecha.slice(0, 10)

    if (!date.startsWith(source.periodo)) {
      discarded.push({
        id: raw.id,
        description: raw.descripcion,
        reason: 'outside-period',
        detail: `${date} queda fuera de ${source.periodo}`,
      })
      continue
    }

    const state: TransactionState = isKnownState(raw.estado)
      ? raw.estado
      : 'en_disputa'

    if (!isKnownState(raw.estado)) {
      warnings.push(
        `${raw.id}: estado desconocido "${raw.estado}", tratado como no liquidado`,
      )
    }

    if (!SETTLED_STATES.has(state)) {
      discarded.push({
        id: raw.id,
        description: raw.descripcion,
        reason: 'unsettled-state',
        detail: `estado "${state}"`,
      })
      continue
    }

    const label =
      raw.categoria === null || raw.categoria.trim() === ''
        ? UNCATEGORISED_LABEL
        : raw.categoria.trim()

    normalised.push({
      id: raw.id,
      date,
      timestamp: raw.fecha,
      description: raw.descripcion.trim(),
      account: raw.cuenta,
      amount: Math.abs(amount),
      currency: raw.moneda,
      categoryId:
        label === UNCATEGORISED_LABEL ? UNCATEGORISED_ID : slugify(label),
      categoryLabel: label,
      state,
      flow: classifyFlow(raw.categoria, raw.descripcion),
    })
  }

  // Two rows describing the same charge — same instant, amount, description and
  // account — are one charge. The most settled one survives.
  const byFingerprint = new Map<string, Transaction>()
  for (const tx of normalised) {
    const key = [tx.timestamp, tx.amount, tx.description, tx.account].join('|')
    const existing = byFingerprint.get(key)

    if (existing === undefined) {
      byFingerprint.set(key, tx)
      continue
    }

    const [keep, drop] =
      STATE_RANK[tx.state] < STATE_RANK[existing.state]
        ? [tx, existing]
        : [existing, tx]

    byFingerprint.set(key, keep)
    discarded.push({
      id: drop.id,
      description: drop.description,
      reason: 'duplicate',
      detail: `mismo cargo que ${keep.id}`,
    })
  }

  const deduped = [...byFingerprint.values()].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  )

  const transactions = deduped.filter((tx) => tx.flow === 'consumption')
  const excludedFlows = deduped.filter((tx) => tx.flow !== 'consumption')

  const uncategorised = transactions.filter(
    (tx) => tx.categoryId === UNCATEGORISED_ID,
  )
  if (uncategorised.length > 0) {
    warnings.push(
      `${String(uncategorised.length)} movimientos sin categoría (${uncategorised.map((tx) => tx.id).join(', ')})`,
    )
  }

  return {
    period: source.periodo,
    generatedAt: source.generado_en,
    transactions,
    excludedFlows,
    discarded,
    warnings,
  }
}
