import { useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  TRANSACTIONS,
  type ExpenseCategoryId,
} from '../../data/expenses'
import { CATEGORY_PRESENTATION } from '../../lib/categoryPresentation'
import { currency, shortDate } from '../../lib/format'
import { CategoryFilter } from '../CategoryFilter'
import { TransactionFlag } from '../TransactionFlag'

const COLUMNS = [
  { key: 'id', header: 'ID', numeric: false },
  { key: 'date', header: 'Fecha', numeric: false },
  { key: 'description', header: 'Descripción', numeric: false },
  { key: 'account', header: 'Cuenta', numeric: false },
  { key: 'flags', header: 'Flags', numeric: false },
  { key: 'amount', header: 'Monto', numeric: true },
  { key: 'category', header: 'Categoría', numeric: false },
]

export const TransactionsTable = () => {
  const [selected, setSelected] = useState<ReadonlySet<ExpenseCategoryId>>(
    new Set(),
  )

  const toggle = (id: ExpenseCategoryId) => {
    setSelected((current) => {
      const next = new Set(current)
      // Toggling the last active category returns to "Todas" rather than
      // leaving an empty table nobody asked for.
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const rows = useMemo(
    () =>
      selected.size === 0
        ? TRANSACTIONS
        : TRANSACTIONS.filter((tx) => selected.has(tx.category)),
    [selected],
  )

  const shownTotal = useMemo(
    () => rows.reduce((acc, tx) => acc + tx.amount, 0),
    [rows],
  )

  const isFiltered = selected.size > 0

  return (
    <section
      id="movimientos"
      // `scroll-mt` clears the sticky header: without it, jumping to this
      // anchor parks the heading and the filter underneath it.
      className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-4 pb-20"
      aria-labelledby="movimientos-title"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="movimientos-title"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Movimientos
          </h2>
          {/*
            The filtered sum is stated, not left to be inferred. Without it a
            reader compares a filtered table against the month total in the
            hero and concludes the page contradicts itself.
          */}
          <p
            className="mt-1 text-sm text-ink-secondary"
            // Announced when the filter changes, so a screen-reader user is
            // told the table reshaped instead of discovering it by exploring.
            aria-live="polite"
          >
            {isFiltered
              ? `${String(rows.length)} de ${String(TRANSACTIONS.length)} movimientos · ${currency(shownTotal)}`
              : `Los ${String(TRANSACTIONS.length)} cargos que componen el total del mes.`}
          </p>
        </div>

        <CategoryFilter
          selected={selected}
          onToggle={toggle}
          onClear={() => setSelected(new Set())}
        />
      </div>

      {/*
        The scroll lives on this container, never on the page. A wide table that
        makes the whole body scroll sideways breaks every other section with it.
      */}
      <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption className="sr-only">
            Movimientos del mes: identificador, fecha, descripción, cuenta,
            marcas, monto y categoría
          </caption>

          <thead>
            <tr className="border-b border-hairline">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-5 py-3 text-xs font-medium whitespace-nowrap text-ink-muted ${
                    column.numeric ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-hairline last:border-0"
              >
                {/* The id identifies the row, so it is a header cell. */}
                <th
                  scope="row"
                  className="num-align px-5 py-3.5 text-left font-normal whitespace-nowrap text-ink-muted"
                >
                  {tx.id}
                </th>

                <td className="px-5 py-3.5 whitespace-nowrap text-ink-secondary">
                  {shortDate(tx.date)}
                </td>

                <td className="px-5 py-3.5 font-medium text-ink">
                  {tx.description}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-ink-secondary">
                  {tx.account}
                </td>

                <td className="px-5 py-3.5">
                  {tx.flags.length === 0 ? (
                    // An em dash, not an empty cell: it says "no flags" rather
                    // than leaving the reader unsure whether data is missing.
                    <span className="text-ink-muted" aria-label="Sin marcas">
                      —
                    </span>
                  ) : (
                    <span className="flex flex-wrap gap-1.5">
                      {tx.flags.map((flag) => (
                        <TransactionFlag key={flag} flag={flag} />
                      ))}
                    </span>
                  )}
                </td>

                {/* Amounts align down the column, so these DO get tabular figures. */}
                <td className="num-align px-5 py-3.5 text-right font-medium whitespace-nowrap text-ink">
                  {currency(tx.amount)}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {/* The swatch carries category identity; the text stays in
                        ink so it never inherits a hue that fails contrast. */}
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: `var(${CATEGORY_PRESENTATION[tx.category].colorVar})`,
                      }}
                    />
                    <span className="text-ink-secondary">
                      {CATEGORY_LABELS[tx.category]}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Datos de ejemplo. Los totales del encabezado se derivan de esta misma
        tabla, así que no pueden discrepar.
      </p>
    </section>
  )
}
