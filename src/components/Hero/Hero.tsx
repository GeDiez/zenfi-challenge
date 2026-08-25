import {
  CURRENT_PERIOD,
  EXPENSE_CATEGORIES,
  monthlyTotal,
} from '../../data/expenses'
import { currency, share } from '../../lib/format'
import { CATEGORY_PRESENTATION } from '../../lib/categoryPresentation'
import { ExpenseCategoryCard } from '../ExpenseCategoryCard'

export const Hero = () => (
  <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
    <div>
      <p className="text-sm font-medium text-ink-muted">{CURRENT_PERIOD}</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-ink md:text-5xl">
        Total de gasto del mes
      </h1>

      {/*
        The one hero figure on the page. Proportional figures on purpose —
        tabular-nums equalises digit widths and makes a large standalone
        number look loose.
      */}
      <p className="mt-6 text-6xl font-semibold tracking-tight text-ink md:text-7xl">
        {currency(monthlyTotal)}
      </p>

      <p className="mt-5 max-w-md text-pretty text-ink-secondary">
        Estas son las categorías en las que más gastas.
      </p>
    </div>

    <ul className="grid gap-4 sm:grid-cols-2">
      {EXPENSE_CATEGORIES.map((category) => {
        const { colorVar, Icon } = CATEGORY_PRESENTATION[category.id]
        return (
          <li key={category.id}>
            <ExpenseCategoryCard
              label={category.label}
              amount={currency(category.amount)}
              share={share(category.amount, monthlyTotal)}
              colorVar={colorVar}
              icon={<Icon className="h-5 w-5" />}
            />
          </li>
        )
      })}
    </ul>
  </section>
)
