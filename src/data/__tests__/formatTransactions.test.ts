import {
  CATEGORY_TOTALS,
  DISCARDED,
  EXCLUDED_FLOWS,
  MONTHLY_TOTAL,
  PERIOD,
  TRANSACTIONS,
  UNCATEGORISED_ID,
} from '..'
import { formatTransactions, type RawExport } from '../formatTransactions'
import rawExport from '../transactions.json'

const raw = rawExport as RawExport
const rawById = (id: string) => raw.movimientos.find((m) => m.id === id)
const discardOf = (id: string) => DISCARDED.find((d) => d.id === id)
const has = (id: string) => TRANSACTIONS.some((tx) => tx.id === id)

/**
 * Every case below names the record in the source that motivated the rule. A
 * test that only asserts a count would still pass while cleaning the wrong row.
 */
describe('formatTransactions', () => {
  describe('amounts', () => {
    it('reads an amount stored as a string', () => {
      // txn_024 ships `"1876.40"` — a serialiser defect, not a missing value.
      expect(rawById('txn_024')?.monto).toBe('1876.40')

      const tx = TRANSACTIONS.find((t) => t.id === 'txn_024')
      expect(tx?.amount).toBe(1876.4)
    })

    it('keeps a positive-signed charge as an expense', () => {
      // The sign in this export is unreliable: txn_024 (Walmart) and txn_048
      // (car insurance) are both stored POSITIVE and both are charges. Trusting
      // the sign would silently drop them from the month's total.
      expect(Number(rawById('txn_048')?.monto)).toBeGreaterThan(0)
      expect(has('txn_048')).toBe(true)
      expect(TRANSACTIONS.find((t) => t.id === 'txn_048')?.amount).toBe(2150)
    })

    it('normalises every amount to a positive magnitude', () => {
      expect(TRANSACTIONS.every((tx) => tx.amount > 0)).toBe(true)
    })

    it('drops a zero-amount movement', () => {
      expect(discardOf('txn_036')?.reason).toBe('amount-zero')
    })
  })

  describe('flows', () => {
    it('does not count income as spending', () => {
      for (const id of ['txn_001', 'txn_057']) {
        expect(has(id)).toBe(false)
        expect(EXCLUDED_FLOWS.some((tx) => tx.id === id)).toBe(true)
      }
    })

    it('recognises a refund by its description, not its category', () => {
      // txn_028 is filed under "Compras" but is money coming back.
      expect(rawById('txn_028')?.categoria).toBe('Compras')
      expect(EXCLUDED_FLOWS.find((tx) => tx.id === 'txn_028')?.flow).toBe(
        'income',
      )
    })

    it('excludes transfers, which move money without spending it', () => {
      // A card payment repeats purchases that are already listed individually.
      for (const id of ['txn_010', 'txn_017', 'txn_020', 'txn_043']) {
        expect(has(id)).toBe(false)
        expect(EXCLUDED_FLOWS.find((tx) => tx.id === id)?.flow).toBe('transfer')
      }
    })

    it('keeps excluded flows instead of discarding them', () => {
      expect(EXCLUDED_FLOWS.length).toBeGreaterThan(0)
      const discardedIds = new Set(DISCARDED.map((d) => d.id))
      expect(EXCLUDED_FLOWS.some((tx) => discardedIds.has(tx.id))).toBe(false)
    })
  })

  describe('dates', () => {
    it('keeps the calendar day as written, without a timezone shift', () => {
      // `new Date('2026-08-01T08:12:00-06:00')` is an instant; formatting it in
      // another zone can render the previous day.
      expect(TRANSACTIONS.find((t) => t.id === 'txn_002')?.date).toBe(
        '2026-08-01',
      )
    })

    it('drops movements outside the declared period', () => {
      expect(PERIOD).toBe('2026-08')
      expect(discardOf('txn_059')?.reason).toBe('outside-period')
      expect(discardOf('txn_060')?.reason).toBe('outside-period')
    })
  })

  describe('duplicates', () => {
    it('collapses an identical charge recorded twice', () => {
      expect(has('txn_021')).toBe(true)
      expect(discardOf('txn_022')?.reason).toBe('duplicate')
    })

    it('keeps the settled row when the same charge appears in two states', () => {
      // txn_044 is confirmed and txn_045 is the same charge still pending.
      expect(has('txn_044')).toBe(true)
      expect(discardOf('txn_045')).toBeDefined()
    })
  })

  describe('categories and currency', () => {
    it('folds null and empty categories into one bucket', () => {
      for (const id of ['txn_016', 'txn_030', 'txn_049']) {
        expect(TRANSACTIONS.find((tx) => tx.id === id)?.categoryId).toBe(
          UNCATEGORISED_ID,
        )
      }
    })

    it('drops a foreign-currency row rather than inventing a rate', () => {
      expect(rawById('txn_032')?.moneda).toBe('USD')
      expect(discardOf('txn_032')?.reason).toBe('foreign-currency')
    })

    it('drops unsettled states', () => {
      for (const id of ['txn_053', 'txn_056', 'txn_061']) {
        expect(discardOf(id)?.reason).toBe('unsettled-state')
      }
    })
  })

  describe('derived totals', () => {
    it('sums to exactly the transactions it lists', () => {
      const sum = TRANSACTIONS.reduce((acc, tx) => acc + tx.amount, 0)
      expect(MONTHLY_TOTAL).toBeCloseTo(sum, 2)
    })

    it('splits the total across categories without losing a peso', () => {
      const sum = CATEGORY_TOTALS.reduce((acc, c) => acc + c.amount, 0)
      expect(sum).toBeCloseTo(MONTHLY_TOTAL, 2)
    })

    it('has shares that add up to one', () => {
      const shares = CATEGORY_TOTALS.reduce((acc, c) => acc + c.share, 0)
      expect(shares).toBeCloseTo(1, 6)
    })

    it('orders categories by spend, descending', () => {
      const amounts = CATEGORY_TOTALS.map((c) => c.amount)
      expect([...amounts].sort((a, b) => b - a)).toEqual(amounts)
    })
  })

  it('accounts for every source row as kept, excluded or discarded', () => {
    // Nothing may vanish silently: a total that quietly omits rows is worse
    // than one that is visibly incomplete.
    const seen = new Set([
      ...TRANSACTIONS.map((t) => t.id),
      ...EXCLUDED_FLOWS.map((t) => t.id),
      ...DISCARDED.map((d) => d.id),
    ])
    expect(seen.size).toBe(raw.movimientos.length)
  })

  it('is pure — the same input yields the same output', () => {
    const a = formatTransactions(raw)
    const b = formatTransactions(raw)
    expect(a.transactions).toEqual(b.transactions)
    expect(a.discarded).toEqual(b.discarded)
  })
})
