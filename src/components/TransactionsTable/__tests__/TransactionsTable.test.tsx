import { render, screen, within } from '@testing-library/react'
import { TRANSACTIONS, UNCATEGORISED_ID } from '../../../data'
import { TransactionsTable } from '../TransactionsTable'

const bodyRows = () =>
  within(screen.getByRole('table')).getAllByRole('row').slice(1)

/** Presentational: it renders what it is handed and never filters. */
describe('TransactionsTable', () => {
  it('exposes the seven columns, in order', () => {
    render(<TransactionsTable rows={TRANSACTIONS} />)

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

  it('renders exactly the rows it is given', () => {
    const slice = TRANSACTIONS.slice(0, 3)
    render(<TransactionsTable rows={slice} />)

    expect(bodyRows()).toHaveLength(slice.length)
  })

  it('says so when the slice is empty, instead of showing a headed shell', () => {
    render(<TransactionsTable rows={[]} />)

    expect(
      screen.getByText('Ningún movimiento coincide con el filtro.'),
    ).toBeInTheDocument()
  })

  it('flags an uncategorised charge in words, not by colour', () => {
    render(<TransactionsTable rows={TRANSACTIONS} />)

    const uncategorised = TRANSACTIONS.filter(
      (tx) => tx.categoryId === UNCATEGORISED_ID,
    )
    expect(uncategorised.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sin categoría').length).toBeGreaterThanOrEqual(
      uncategorised.length,
    )
  })

  it('renders a dash where the source had no account', () => {
    render(<TransactionsTable rows={TRANSACTIONS} />)

    const missing = TRANSACTIONS.filter((tx) => tx.account === null)
    // An empty cell would leave the reader unsure whether data is missing.
    expect(screen.queryAllByLabelText('Sin cuenta')).toHaveLength(
      missing.length,
    )
  })
})
