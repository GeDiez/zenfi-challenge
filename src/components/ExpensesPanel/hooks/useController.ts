import { useMemo, useState } from 'react'
import {
  ACCOUNT_TOTALS,
  CATEGORY_TOTALS,
  TRANSACTIONS,
  UNKNOWN_ACCOUNT_ID,
} from '../../../data'
import { categoryPresentation } from '../../../lib/categoryPresentation'
import type { FilterOption } from '../../MultiSelectFilter'

function useToggleSet() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const handleToggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      // Unchecking the last active option returns to "todas" rather than
      // leaving an empty view nobody asked for.
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const handleClear = () => {
    setSelected(new Set())
  }

  // Named `handle*` because they are passed straight to `onX` props, which the
  // lint rule enforces so a handler reads as one at the call site.
  return { selected, handleToggle, handleClear }
}

/**
 * Owns every filter that scopes the detail below the filter row.
 *
 * The two dimensions compose with AND: a selection in each narrows to the
 * intersection. State lives here rather than inside the chart or the table — a
 * filter per component is how a page starts contradicting itself, with one
 * figure answering a question the other one is not.
 *
 * Option lists are derived from the WHOLE month, not from the other filter's
 * current result. Cross-filtering them would make options vanish from under the
 * pointer mid-click, and leave no way back to a selection just dismissed.
 */
export function useController() {
  const categories = useToggleSet()
  const accounts = useToggleSet()

  const transactions = useMemo(
    () =>
      TRANSACTIONS.filter((tx) => {
        const categoryOk =
          categories.selected.size === 0 ||
          categories.selected.has(tx.categoryId)
        const accountOk =
          accounts.selected.size === 0 ||
          accounts.selected.has(tx.account ?? UNKNOWN_ACCOUNT_ID)
        return categoryOk && accountOk
      }),
    [categories.selected, accounts.selected],
  )

  const categoryOptions: FilterOption[] = useMemo(
    () =>
      CATEGORY_TOTALS.map((entry) => ({
        id: entry.id,
        label: entry.label,
        count: entry.count,
        colorVar: categoryPresentation(entry.id).colorVar,
      })),
    [],
  )

  const accountOptions: FilterOption[] = useMemo(
    () =>
      ACCOUNT_TOTALS.map((entry) => ({
        id: entry.id,
        label: entry.label,
        count: entry.count,
      })),
    [],
  )

  /**
   * The line takes a category's hue only when exactly ONE is selected. With
   * several the series is a blend and no category owns it — painting it in one
   * of their colours would attribute the whole line to that category. The
   * account filter never changes the hue: a card is not a category.
   */
  const lineColorVar =
    categories.selected.size === 1
      ? categoryPresentation([...categories.selected][0]).colorVar
      : '--color-series-1'

  return {
    categories,
    accounts,
    transactions,
    categoryOptions,
    accountOptions,
    lineColorVar,
  }
}
