import { useMemo } from 'react'
import { TRANSACTIONS, type Transaction } from '../../../data'
import { currency } from '../../../lib/format'
import { transactionFlags } from '../../../lib/transactionFlags'

export function useController(rows: Transaction[]) {
  const shownTotal = useMemo(
    () => rows.reduce((acc, tx) => acc + tx.amount, 0),
    [rows],
  )

  const isFiltered = rows.length !== TRANSACTIONS.length

  /**
   * The filtered sum is stated, not left to be inferred. Without it a reader
   * compares a filtered table against the month total in the hero and concludes
   * the page contradicts itself.
   */
  const summary = isFiltered
    ? `${String(rows.length)} de ${String(TRANSACTIONS.length)} movimientos · ${currency(shownTotal)}`
    : `Los ${String(TRANSACTIONS.length)} cargos que componen el total del mes.`

  /** Flags resolved here so the JSX stays a list of elements. */
  const decorated = useMemo(
    () => rows.map((tx) => ({ tx, flags: transactionFlags(tx) })),
    [rows],
  )

  return { decorated, summary, isEmpty: rows.length === 0 }
}
