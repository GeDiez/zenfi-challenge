import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CATEGORY_LABELS, TRANSACTIONS } from '../../../data/expenses'
import { currency } from '../../../lib/format'
import { TransactionsTable } from '../TransactionsTable'

const bodyRows = () =>
  within(screen.getByRole('table')).getAllByRole('row').slice(1)

const filterTrigger = () => screen.getByRole('button', { name: /categoría/i })

const openFilter = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(filterTrigger())
}

describe('TransactionsTable', () => {
  it('exposes the seven columns, in order', () => {
    render(<TransactionsTable />)

    const headers = within(screen.getByRole('table'))
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent)

    expect(headers).toEqual([
      'ID',
      'Fecha',
      'Descripción',
      'Cuenta',
      'Flags',
      'Monto',
      'Categoría',
    ])
  })

  it('lists every transaction before any filtering', () => {
    render(<TransactionsTable />)

    expect(bodyRows()).toHaveLength(TRANSACTIONS.length)
  })

  it('labels flags in text, never by colour alone', () => {
    render(<TransactionsTable />)

    expect(screen.getAllByText('Recurrente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Por revisar').length).toBeGreaterThan(0)
    expect(screen.getByText('Reembolso')).toBeInTheDocument()
  })

  describe('the category dropdown', () => {
    it('keeps its options out of the accessibility tree until opened', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

      await openFilter(user)

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    })

    it('narrows the table to the chosen category', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.transport }),
      )

      const expected = TRANSACTIONS.filter((tx) => tx.category === 'transport')
      expect(bodyRows()).toHaveLength(expected.length)

      // Asserted by id, not description: two different transactions share the
      // description "Uber", and a count alone would not prove it is the RIGHT
      // subset.
      const shownIds = bodyRows().map(
        (row) => within(row).getAllByRole('rowheader')[0].textContent,
      )
      expect(shownIds).toEqual(expected.map((tx) => tx.id))
    })

    it('combines categories rather than replacing the selection', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.transport }),
      )
      // The panel stays open, which is the point of a multi-select filter.
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.food }),
      )

      const expected = TRANSACTIONS.filter(
        (tx) => tx.category === 'transport' || tx.category === 'food',
      )
      expect(bodyRows()).toHaveLength(expected.length)
    })

    it('summarises the selection on the trigger', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      expect(filterTrigger()).toHaveTextContent('Todas las categorías')

      await openFilter(user)
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.food }),
      )
      expect(filterTrigger()).toHaveTextContent(CATEGORY_LABELS.food)

      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.insurance }),
      )
      expect(filterTrigger()).toHaveTextContent('2 categorías')
    })

    it('states the filtered sum, so it cannot be mistaken for the month total', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.insurance }),
      )

      const rows = TRANSACTIONS.filter((tx) => tx.category === 'insurance')
      const sum = rows.reduce((acc, tx) => acc + tx.amount, 0)

      // `toHaveTextContent` with a string compares literally. A RegExp would
      // not: a formatted amount starts with `$`, which regex reads as
      // end-of-input, so /\$1,890/ can never match.
      const summary = screen.getByText(/movimientos/)
      expect(summary).toHaveTextContent(
        `${String(rows.length)} de ${String(TRANSACTIONS.length)} movimientos`,
      )
      expect(summary).toHaveTextContent(currency(sum))
    })

    it('returns to the full table when the active category is unchecked', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      const box = screen.getByRole('checkbox', { name: CATEGORY_LABELS.food })

      await user.click(box)
      expect(bodyRows().length).toBeLessThan(TRANSACTIONS.length)

      await user.click(box)
      expect(bodyRows()).toHaveLength(TRANSACTIONS.length)
    })

    it('clears every selection through "Mostrar todas"', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.entertainment }),
      )
      await user.click(screen.getByRole('button', { name: 'Mostrar todas' }))

      expect(bodyRows()).toHaveLength(TRANSACTIONS.length)
      expect(filterTrigger()).toHaveTextContent('Todas las categorías')
    })

    it('closes on Escape and hands focus back to the trigger', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      await user.keyboard('{Escape}')

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'false')
      // Without this the keyboard user is stranded on an element that no
      // longer exists.
      expect(filterTrigger()).toHaveFocus()
    })

    it('closes when the pointer goes elsewhere, keeping the selection', async () => {
      const user = userEvent.setup()
      render(<TransactionsTable />)

      await openFilter(user)
      await user.click(
        screen.getByRole('checkbox', { name: CATEGORY_LABELS.food }),
      )
      await user.click(screen.getByRole('heading', { name: 'Movimientos' }))

      expect(filterTrigger()).toHaveAttribute('aria-expanded', 'false')
      // Dismissing the panel is not the same as discarding the filter.
      expect(filterTrigger()).toHaveTextContent(CATEGORY_LABELS.food)
    })
  })
})
