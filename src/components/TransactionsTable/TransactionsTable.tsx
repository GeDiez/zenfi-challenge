import { DISCARDED, PERIOD, type Transaction } from '../../data'
import { categoryPresentation } from '../../lib/categoryPresentation'
import { currency, monthName, shortDate } from '../../lib/format'
import { TransactionFlag } from '../TransactionFlag'
import { useController } from './hooks/useController'

const COLUMNS = [
  { key: 'id', header: 'ID', numeric: false },
  { key: 'date', header: 'Fecha', numeric: false },
  { key: 'description', header: 'Descripción', numeric: false },
  { key: 'account', header: 'Cuenta', numeric: false },
  { key: 'flags', header: 'Flags', numeric: false },
  { key: 'amount', header: 'Monto', numeric: true },
  { key: 'category', header: 'Categoría', numeric: false },
]

type Props = {
  /** Already filtered upstream — this component never filters. */
  rows: Transaction[]
}

export const TransactionsTable = ({ rows }: Props) => {
  const { decorated, summary, isEmpty } = useController(rows)

  return (
    <section
      id="movimientos"
      // `scroll-mt` clears the sticky header: without it, jumping to this
      // anchor parks the heading and the filter underneath it.
      className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-4 pb-20"
      aria-labelledby="movimientos-title"
    >
      <div className="mb-6">
        <div>
          <h2
            id="movimientos-title"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Tus gastos de {monthName(PERIOD)}
          </h2>
          {/*
            The filtered sum is stated, not left to be inferred. Without it a
            reader compares a filtered table against the month total in the
            hero and concludes the page contradicts itself.
          */}
          <p
            className="mt-1 text-sm text-ink-secondary"
            // `role="status"` already implies aria-live="polite", and it names
            // what this line IS: the table's current state, announced when the
            // filter reshapes it instead of left to be discovered.
            role="status"
          >
            {summary}
          </p>
        </div>
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
            {isEmpty && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-5 py-10 text-center text-sm text-ink-muted"
                >
                  Ningún movimiento coincide con el filtro.
                </td>
              </tr>
            )}
            {decorated.map(({ tx, flags }) => (
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

                <td className="max-w-xs truncate px-5 py-3.5 font-medium text-ink">
                  {/* Long merchant strings are clamped with an ellipsis and
                        the full text stays reachable through the title. */}
                  <span title={tx.description}>{tx.description}</span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-ink-secondary">
                  {tx.account ?? (
                    <span className="text-ink-muted" aria-label="Sin cuenta">
                      —
                    </span>
                  )}
                </td>

                <td className="px-5 py-3.5">
                  {flags.length === 0 ? (
                    // An em dash, not an empty cell: it says "no flags"
                    // rather than leaving the reader unsure data is missing.
                    <span className="text-ink-muted" aria-label="Sin marcas">
                      —
                    </span>
                  ) : (
                    <span className="flex flex-wrap gap-1.5">
                      {flags.map((flag) => (
                        <TransactionFlag key={flag} flag={flag} />
                      ))}
                    </span>
                  )}
                </td>

                {/* Amounts align down the column, so these DO get tabular
                      figures. */}
                <td className="num-align px-5 py-3.5 text-right font-medium whitespace-nowrap text-ink">
                  {currency(tx.amount)}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {/* The swatch carries category identity; the text stays
                          in ink so it never inherits a hue that fails
                          contrast. */}
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: `var(${categoryPresentation(tx.categoryId).colorVar})`,
                      }}
                    />
                    <span className="text-ink-secondary">
                      {tx.categoryLabel}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        The cleaning is stated, not hidden. A total that quietly omits rows is
        worse than one that is visibly incomplete.
      */}
      <p className="mt-4 text-xs text-ink-muted">
        Se excluyeron {DISCARDED.length} movimientos del origen: fuera del
        periodo, sin liquidar, duplicados, en otra moneda o de monto cero. Los
        ingresos y traspasos tampoco cuentan como gasto.
      </p>
    </section>
  )
}
