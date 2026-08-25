import { useMemo } from 'react'
import {
  FEATURED_CATEGORIES,
  MONTHLY_INCOME,
  MONTHLY_TOTAL,
  PERIOD,
} from '../../../data'
import { categoryPresentation } from '../../../lib/categoryPresentation'
import { currency, monthLabel, percent } from '../../../lib/format'

export function useController() {
  const cards = useMemo(
    () =>
      FEATURED_CATEGORIES.map((category) => {
        const { colorVar, Icon } = categoryPresentation(category.id)
        return {
          id: category.id,
          label: category.label,
          amount: currency(category.amount),
          share: percent(category.share),
          colorVar,
          Icon,
        }
      }),
    [],
  )

  return {
    period: monthLabel(PERIOD),
    total: currency(MONTHLY_TOTAL),
    income: currency(MONTHLY_INCOME),
    cards,
  }
}
