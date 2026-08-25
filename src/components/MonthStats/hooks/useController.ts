import {
  LARGEST_CHARGE,
  MONTHLY_INCOME,
  MONTHLY_TOTAL,
  MOST_RECURRING,
  NET_BALANCE,
} from '../../../data'
import { currency } from '../../../lib/format'

export type StatTile = {
  id: string
  label: string
  value: string
  detail: string
  /** Direction of the figure, when it has one. Never carried by colour alone. */
  tone: 'neutral' | 'positive' | 'negative'
}

export function useController() {
  const tiles: StatTile[] = []

  if (MOST_RECURRING !== null) {
    tiles.push({
      id: 'recurring',
      label: 'Tu gasto más recurrente',
      value: MOST_RECURRING.description,
      detail: `${String(MOST_RECURRING.count)} cargos · ${currency(MOST_RECURRING.total)} en total`,
      tone: 'neutral',
    })
  }

  if (LARGEST_CHARGE !== null) {
    tiles.push({
      id: 'largest',
      label: 'Tu gasto más fuerte',
      value: currency(LARGEST_CHARGE.amount),
      detail: `${LARGEST_CHARGE.description} · ${LARGEST_CHARGE.categoryLabel}`,
      tone: 'neutral',
    })
  }

  tiles.push({
    id: 'balance',
    label: 'Ingresos menos egresos',
    // The sign is part of the number, not something the colour has to imply.
    value: `${NET_BALANCE < 0 ? '−' : '+'}${currency(Math.abs(NET_BALANCE))}`,
    detail:
      NET_BALANCE < 0
        ? `Gastaste ${currency(Math.abs(NET_BALANCE))} más de lo que ingresó`
        : `Te quedaron ${currency(NET_BALANCE)} del periodo`,
    tone: NET_BALANCE < 0 ? 'negative' : 'positive',
  })

  return {
    tiles,
    income: currency(MONTHLY_INCOME),
    spending: currency(MONTHLY_TOTAL),
  }
}
