import { render, screen, within } from '@testing-library/react'
import {
  LARGEST_CHARGE,
  MONTHLY_INCOME,
  MONTHLY_TOTAL,
  MOST_RECURRING,
  NET_BALANCE,
  TRANSACTIONS,
} from '../../../data'
import { currency } from '../../../lib/format'
import { MonthStats } from '../MonthStats'

describe('MonthStats', () => {
  it('names the charge that repeats most, with how often', () => {
    render(<MonthStats />)

    expect(MOST_RECURRING).not.toBeNull()
    const tile = screen
      .getByText('Tu gasto más recurrente')
      .closest('li') as HTMLElement

    expect(
      within(tile).getByText(MOST_RECURRING!.description),
    ).toBeInTheDocument()
    // The count is the point: one charge is not a habit.
    expect(tile).toHaveTextContent(`${String(MOST_RECURRING!.count)} cargos`)
  })

  it('ranks the recurring spend by occurrence, not by amount', () => {
    // The largest charge is a single rent payment; ranking by amount would
    // dress a one-off as a routine.
    expect(MOST_RECURRING!.count).toBeGreaterThan(1)
    const byAmount = [...TRANSACTIONS].sort((a, b) => b.amount - a.amount)[0]
    expect(MOST_RECURRING!.description).not.toBe(byAmount.description)
  })

  it('shows the single largest charge with what it was', () => {
    render(<MonthStats />)

    expect(LARGEST_CHARGE).not.toBeNull()
    const tile = screen
      .getByText('Tu gasto más fuerte')
      .closest('li') as HTMLElement

    expect(
      within(tile).getByText(currency(LARGEST_CHARGE!.amount)),
    ).toBeInTheDocument()
    expect(tile).toHaveTextContent(LARGEST_CHARGE!.description)
  })

  it('states the balance with its sign, not just its colour', () => {
    render(<MonthStats />)

    expect(NET_BALANCE).toBeCloseTo(MONTHLY_INCOME - MONTHLY_TOTAL, 2)

    const tile = screen
      .getByText('Ingresos menos egresos')
      .closest('li') as HTMLElement

    // A reader with a colour-vision deficiency gets nothing from a red number.
    // The sign and the sentence carry the direction.
    expect(tile).toHaveTextContent(NET_BALANCE < 0 ? '−' : '+')
    expect(tile).toHaveTextContent(/más de lo que ingresó|Te quedaron/)
  })

  it('does not soften a negative month into an absolute value', () => {
    render(<MonthStats />)

    const tile = screen
      .getByText('Ingresos menos egresos')
      .closest('li') as HTMLElement

    expect(NET_BALANCE).toBeLessThan(0)
    expect(tile).toHaveTextContent(currency(Math.abs(NET_BALANCE)))
    expect(tile).not.toHaveTextContent('+')
  })

  it('offers the download without exposing the opener', () => {
    render(<MonthStats />)

    const cta = screen.getByRole('link', { name: /descarga zenfi/i })

    expect(cta).toHaveAttribute('href', 'https://zenfi.mx')
    expect(cta).toHaveAttribute('target', '_blank')
    // `noopener` is the security half: without it the opened page can reach
    // back through window.opener.
    expect(cta.getAttribute('rel')).toContain('noopener')
    // And it says where it goes.
    expect(cta).toHaveAccessibleName(/pestaña nueva/i)
  })
})
