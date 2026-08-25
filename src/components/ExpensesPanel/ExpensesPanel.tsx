import { DailySpendChart } from '../DailySpendChart'
import { MultiSelectFilter } from '../MultiSelectFilter'
import { TransactionsTable } from '../TransactionsTable'
import { useController } from './hooks/useController'

/**
 * The filter row and everything it scopes.
 *
 * One row, above the content it affects — the chart and the table re-render
 * against the SAME slice, so their figures can never disagree. The hero sits
 * above this row and is deliberately outside its scope: it reports the month,
 * not the current selection.
 */
export const ExpensesPanel = () => {
  const {
    categories,
    accounts,
    transactions,
    categoryOptions,
    accountOptions,
    lineColorVar,
  } = useController()

  return (
    <>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pb-6">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          Filtra el detalle
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            name="Categoría"
            legend="Filtrar por categoría"
            options={categoryOptions}
            selected={categories.selected}
            onToggle={categories.handleToggle}
            onClear={categories.handleClear}
            allLabel="Todas las categorías"
            manyNoun="categorías"
            clearLabel="Mostrar todas"
          />

          <MultiSelectFilter
            name="Tarjeta"
            legend="Filtrar por tarjeta"
            options={accountOptions}
            selected={accounts.selected}
            onToggle={accounts.handleToggle}
            onClear={accounts.handleClear}
            allLabel="Todas las tarjetas"
            manyNoun="tarjetas"
            clearLabel="Mostrar todas"
          />
        </div>
      </div>

      <DailySpendChart transactions={transactions} colorVar={lineColorVar} />
      <TransactionsTable rows={transactions} />
    </>
  )
}
