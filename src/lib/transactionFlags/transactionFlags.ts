import { UNCATEGORISED_ID, type Transaction } from '../../data'

export type TransactionFlagId = 'uncategorised'

/**
 * Flags derived from the transaction, not stored on it.
 *
 * Only one exists today, and that is honest rather than thin: the cleaning
 * rules drop every unsettled row, so "pendiente" and "en disputa" never reach
 * the table. An uncategorised charge, by contrast, is real, kept, and something
 * a person can act on.
 */
export function transactionFlags(tx: Transaction): TransactionFlagId[] {
  return tx.categoryId === UNCATEGORISED_ID ? ['uncategorised'] : []
}
