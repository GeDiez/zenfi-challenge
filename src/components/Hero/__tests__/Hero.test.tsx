import { render, screen, within } from '@testing-library/react'
import {
  FEATURED_CATEGORIES,
  MONTHLY_INCOME,
  MONTHLY_TOTAL,
  TRANSACTIONS,
} from '../../../data'
import { currency, percent } from '../../../lib/format'
import { Hero } from '../Hero'

describe('Hero', () => {
  it('leads with one hero figure, and it equals the sum of the transactions', () => {
    render(<Hero />)

    // Summed independently of the module's derived export, so a broken reduce
    // cannot make this test agree with the bug.
    const expected = TRANSACTIONS.reduce((acc, tx) => acc + tx.amount, 0)
    expect(expected).toBeCloseTo(MONTHLY_TOTAL, 2)

    expect(
      screen.getByRole('heading', {
        name: /total de gasto del mes/i,
        level: 1,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(currency(expected))).toBeInTheDocument()
  })

  it('states income separately from spending', () => {
    render(<Hero />)

    // Income is not negative spending; conflating them would overstate both.
    const income = screen.getByText(currency(MONTHLY_INCOME))
    expect(income).toBeInTheDocument()
    expect(income.closest('p')).toHaveTextContent(/ingresos/i)
  })

  it('carries the income direction in text, not only in colour', () => {
    render(<Hero />)

    const income = screen.getByText(currency(MONTHLY_INCOME)).closest('p')
    expect(income).toHaveTextContent('↑')
  })

  it('features exactly four categories, each naming itself', () => {
    render(<Hero />)

    expect(FEATURED_CATEGORIES).toHaveLength(4)
    for (const category of FEATURED_CATEGORIES) {
      expect(
        screen.getByRole('heading', { name: category.label, level: 3 }),
      ).toBeInTheDocument()
    }
  })

  it('shows each category share against the total, not just its amount', () => {
    render(<Hero />)

    const biggest = FEATURED_CATEGORIES[0]
    const card = screen
      .getByRole('heading', { name: biggest.label, level: 3 })
      .closest('article')
    expect(card).not.toBeNull()

    const scoped = within(card as HTMLElement)
    expect(scoped.getByText(currency(biggest.amount))).toBeInTheDocument()
    expect(
      scoped.getByText(new RegExp(percent(biggest.share))),
    ).toBeInTheDocument()
  })
})
