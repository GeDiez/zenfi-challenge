/**
 * Placeholder figures. Replace this module's contents with the real source —
 * nothing else has to change.
 *
 * Transactions are the ONLY input: category totals and the monthly total are
 * derived from them below, so the table and the hero cannot drift apart. Two
 * hand-maintained lists would agree on the day they were written and on no day
 * after that.
 */

export type ExpenseCategoryId =
  'entertainment' | 'food' | 'transport' | 'insurance'

export type FlagId = 'recurring' | 'review' | 'refund'

export type Transaction = {
  id: string
  /** ISO date, formatted at the edge for display. */
  date: string
  description: string
  account: string
  flags: FlagId[]
  amount: number
  category: ExpenseCategoryId
}

/**
 * Declaration order is the display order AND the colour order. Colour follows
 * the category, never its current rank — a category that overtakes another must
 * not swap hues with it.
 */
export const CATEGORY_ORDER: ExpenseCategoryId[] = [
  'entertainment',
  'food',
  'transport',
  'insurance',
]

export const CATEGORY_LABELS: Record<ExpenseCategoryId, string> = {
  entertainment: 'Entretenimiento',
  food: 'Comidas',
  transport: 'Transporte',
  insurance: 'Seguros',
}

export const FLAG_LABELS: Record<FlagId, string> = {
  recurring: 'Recurrente',
  review: 'Por revisar',
  refund: 'Reembolso',
}

export const TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-2081',
    date: '2026-08-02',
    description: 'Spotify Premium',
    account: 'Crédito ··7702',
    flags: ['recurring'],
    amount: 299,
    category: 'entertainment',
  },
  {
    id: 'TX-2082',
    date: '2026-08-03',
    description: 'Súper Chedraui',
    account: 'Débito ··4821',
    flags: [],
    amount: 1890,
    category: 'food',
  },
  {
    id: 'TX-2083',
    date: '2026-08-04',
    description: 'Gasolinera Shell',
    account: 'Crédito ··7702',
    flags: [],
    amount: 1200,
    category: 'transport',
  },
  {
    id: 'TX-2084',
    date: '2026-08-05',
    description: 'Netflix',
    account: 'Crédito ··7702',
    flags: ['recurring'],
    amount: 249,
    category: 'entertainment',
  },
  {
    id: 'TX-2085',
    date: '2026-08-07',
    description: 'Rappi — comida',
    account: 'Débito ··4821',
    flags: [],
    amount: 420,
    category: 'food',
  },
  {
    id: 'TX-2086',
    date: '2026-08-09',
    description: 'Uber',
    account: 'Débito ··4821',
    flags: [],
    amount: 890,
    category: 'transport',
  },
  {
    id: 'TX-2087',
    date: '2026-08-11',
    description: 'Cafetería Cardinal',
    account: 'Débito ··4821',
    flags: [],
    amount: 285,
    category: 'food',
  },
  {
    id: 'TX-2088',
    date: '2026-08-12',
    description: 'Seguro de auto',
    account: 'Crédito ··7702',
    flags: ['recurring'],
    amount: 1290,
    category: 'insurance',
  },
  {
    id: 'TX-2089',
    date: '2026-08-14',
    description: 'Cinépolis VIP',
    account: 'Crédito ··7702',
    flags: [],
    amount: 780,
    category: 'entertainment',
  },
  {
    id: 'TX-2090',
    date: '2026-08-15',
    description: 'Súper quincena',
    account: 'Débito ··4821',
    flags: [],
    amount: 2100,
    category: 'food',
  },
  {
    id: 'TX-2091',
    date: '2026-08-17',
    description: 'Uber',
    account: 'Débito ··4821',
    flags: ['review'],
    amount: 460,
    category: 'transport',
  },
  {
    id: 'TX-2092',
    date: '2026-08-19',
    description: 'Restaurante Contramar',
    account: 'Crédito ··7702',
    flags: [],
    amount: 640,
    category: 'food',
  },
  {
    id: 'TX-2093',
    date: '2026-08-21',
    description: 'Gastos médicos mayores',
    account: 'Crédito ··7702',
    flags: ['recurring'],
    amount: 600,
    category: 'insurance',
  },
  {
    id: 'TX-2094',
    date: '2026-08-23',
    description: 'Verificación vehicular',
    account: 'Débito ··4821',
    flags: ['review'],
    amount: 900,
    category: 'transport',
  },
  {
    id: 'TX-2095',
    date: '2026-08-24',
    description: 'Concierto Auditorio',
    account: 'Crédito ··7702',
    flags: [],
    amount: 1512,
    category: 'entertainment',
  },
  {
    id: 'TX-2096',
    date: '2026-08-24',
    description: 'Rappi — despensa',
    account: 'Débito ··4821',
    flags: ['refund'],
    amount: 785,
    category: 'food',
  },
]

export type ExpenseCategory = {
  id: ExpenseCategoryId
  label: string
  amount: number
}

/** Derived, never hand-written: the table above is the single source. */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = CATEGORY_ORDER.map(
  (id) => ({
    id,
    label: CATEGORY_LABELS[id],
    amount: TRANSACTIONS.filter((tx) => tx.category === id).reduce(
      (acc, tx) => acc + tx.amount,
      0,
    ),
  }),
)

export const monthlyTotal = TRANSACTIONS.reduce((acc, tx) => acc + tx.amount, 0)

/** The period the figures above describe. */
export const CURRENT_PERIOD = 'Agosto 2026'
