import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ACCOUNT_TOTALS,
  CATEGORY_TOTALS,
  TRANSACTIONS,
  buildDailyTotals,
} from '../../../data'
import { currency } from '../../../lib/format'
import { ExpensesPanel } from '../ExpensesPanel'

const bodyRows = () =>
  within(screen.getByRole('table')).getAllByRole('row').slice(1)

const filterTrigger = () => screen.getByRole('button', { name: /^Categoría/ })
const cardTrigger = () => screen.getByRole('button', { name: /^Tarjeta/ })

const openFilter = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(filterTrigger())
}

const openCards = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(cardTrigger())
}

const optionBox = (label: string) =>
  screen.getByRole('checkbox', {
    name: new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  })

const biggestCard = ACCOUNT_TOTALS[0]

/**
 * Options are named "<Categoría> <n> movimientos" — the count is announced with
 * its unit rather than as a bare number — so the query anchors on the label.
 */
const categoryBox = (label: string) =>
  screen.getByRole('checkbox', {
    name: new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  })

const biggest = CATEGORY_TOTALS[0]
const second = CATEGORY_TOTALS[1]

describe('ExpensesPanel', () => {
  it('shows everything before any filtering', () => {
    render(<ExpensesPanel />)

    expect(bodyRows()).toHaveLength(TRANSACTIONS.length)
  })

  it('scopes BOTH the chart and the table with one selection', async () => {
    const user = userEvent.setup()
    render(<ExpensesPanel />)

    await openFilter(user)
    await user.click(categoryBox(biggest.label))

    const expected = TRANSACTIONS.filter((tx) => tx.categoryId === biggest.id)
    expect(bodyRows()).toHaveLength(expected.length)

    // The chart's summary must describe the SAME slice. Two components filtering
    // independently is how a page starts contradicting itself.
    const daily = buildDailyTotals(expected)
    const peak = daily.reduce((a, b) => (b.amount > a.amount ? b : a))
    expect(screen.getByText(/gastaste más/)).toHaveTextContent(
      currency(peak.amount),
    )
  })

  it('combines categories rather than replacing the selection', async () => {
    const user = userEvent.setup()
    render(<ExpensesPanel />)

    await openFilter(user)
    await user.click(categoryBox(biggest.label))
    await user.click(categoryBox(second.label))

    expect(bodyRows()).toHaveLength(biggest.count + second.count)
    expect(filterTrigger()).toHaveTextContent('2 categorías')
  })

  it('states the filtered sum, so it cannot be mistaken for the month total', async () => {
    const user = userEvent.setup()
    render(<ExpensesPanel />)

    await openFilter(user)
    await user.click(categoryBox(biggest.label))

    // `toHaveTextContent` compares literally. A RegExp would not: a formatted
    // amount starts with `$`, which regex reads as end-of-input.
    const summary = screen.getByText(/de \d+ movimientos/)
    expect(summary).toHaveTextContent(
      `${String(biggest.count)} de ${String(TRANSACTIONS.length)} movimientos`,
    )
    expect(summary).toHaveTextContent(currency(biggest.amount))
  })

  it('returns to everything when the active category is unchecked', async () => {
    const user = userEvent.setup()
    render(<ExpensesPanel />)

    await openFilter(user)
    const box = categoryBox(biggest.label)

    await user.click(box)
    expect(bodyRows().length).toBeLessThan(TRANSACTIONS.length)

    await user.click(box)
    expect(bodyRows()).toHaveLength(TRANSACTIONS.length)
  })

  it('clears every selection through "Mostrar todas"', async () => {
    const user = userEvent.setup()
    render(<ExpensesPanel />)

    await openFilter(user)
    await user.click(categoryBox(biggest.label))
    await user.click(screen.getByRole('button', { name: 'Mostrar todas' }))

    expect(bodyRows()).toHaveLength(TRANSACTIONS.length)
    expect(filterTrigger()).toHaveTextContent('Todas las categorías')
  })

  describe('the card filter', () => {
    it('offers exactly the cards this month shows, derived from the data', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      await openCards(user)

      const boxes = screen.getAllByRole('checkbox')
      expect(boxes).toHaveLength(ACCOUNT_TOTALS.length)
      for (const account of ACCOUNT_TOTALS) {
        expect(optionBox(account.label)).toBeInTheDocument()
      }
    })

    it('narrows the table to one card', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      await openCards(user)
      await user.click(optionBox(biggestCard.label))

      expect(bodyRows()).toHaveLength(biggestCard.count)
      expect(cardTrigger()).toHaveTextContent(biggestCard.label)
    })

    it('composes with the category filter using AND, not OR', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      await openFilter(user)
      await user.click(categoryBox(biggest.label))
      await user.click(cardTrigger())
      await user.click(optionBox(biggestCard.label))

      // The intersection, never the union: a row must match BOTH to survive.
      const expected = TRANSACTIONS.filter(
        (tx) =>
          tx.categoryId === biggest.id && tx.account === biggestCard.label,
      )
      expect(bodyRows()).toHaveLength(expected.length)
      expect(expected.length).toBeLessThanOrEqual(
        Math.min(biggest.count, biggestCard.count),
      )
    })

    it('keeps the card options stable while a category filter is active', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      await openFilter(user)
      await user.click(categoryBox(biggest.label))
      await user.click(cardTrigger())

      // Cross-filtering the option list would make choices vanish from under
      // the pointer and leave no way back to a selection just dismissed.
      expect(screen.getAllByRole('checkbox')).toHaveLength(
        ACCOUNT_TOTALS.length,
      )
    })
  })

  describe('the dropdown', () => {
    it('keeps its options out of the accessibility tree until opened', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

      await openFilter(user)

      expect(screen.getAllByRole('checkbox')).toHaveLength(
        CATEGORY_TOTALS.length,
      )
    })

    it('closes on Escape and hands focus back to the trigger', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      await openFilter(user)
      await user.keyboard('{Escape}')

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'false')
      // Without this the keyboard user is stranded on an element that no longer
      // exists.
      expect(filterTrigger()).toHaveFocus()
    })

    it('closes when the pointer goes elsewhere, keeping the selection', async () => {
      const user = userEvent.setup()
      render(<ExpensesPanel />)

      await openFilter(user)
      await user.click(categoryBox(biggest.label))
      await user.click(screen.getByRole('heading', { name: 'Gasto por día' }))

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'false')
      // Dismissing the panel is not the same as discarding the filter.
      expect(filterTrigger()).toHaveTextContent(biggest.label)
    })
  })
})
