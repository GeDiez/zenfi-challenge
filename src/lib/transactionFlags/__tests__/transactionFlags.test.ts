import { TRANSACTIONS, UNCATEGORISED_ID, type Transaction } from '../../../data'
import { transactionFlags } from '../transactionFlags'

const withCategory = (categoryId: string): Transaction => ({
  id: 'tx',
  date: '2026-08-01',
  timestamp: '2026-08-01T00:00:00-06:00',
  description: 'X',
  account: null,
  amount: 1,
  currency: 'MXN',
  categoryId,
  categoryLabel: 'X',
  state: 'confirmada',
  flow: 'consumption',
})

describe('transactionFlags', () => {
  it('flags a charge with no category', () => {
    expect(transactionFlags(withCategory(UNCATEGORISED_ID))).toEqual([
      'uncategorised',
    ])
  })

  it('flags nothing when the charge is categorised', () => {
    expect(transactionFlags(withCategory('comida'))).toEqual([])
  })

  it('matches the uncategorised rows in the real data', () => {
    const flagged = TRANSACTIONS.filter((tx) => transactionFlags(tx).length > 0)
    const uncategorised = TRANSACTIONS.filter(
      (tx) => tx.categoryId === UNCATEGORISED_ID,
    )
    expect(flagged).toEqual(uncategorised)
  })
})
