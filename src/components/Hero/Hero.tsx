import { ExpenseCategoryCard } from '../ExpenseCategoryCard'
import { useController } from './hooks/useController'

export const Hero = () => {
  const { period, total, income, cards } = useController()

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
      <div>
        <p className="text-sm font-medium text-ink-muted">{period}</p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-ink md:text-5xl">
          Total de gasto del mes
        </h1>

        {/*
          The one hero figure on the page. Proportional figures on purpose —
          tabular-nums equalises digit widths and makes a large standalone
          number look loose.
        */}
        <p className="mt-6 text-6xl font-semibold tracking-tight text-ink md:text-7xl">
          {total}
        </p>

        {/*
          Income wears `delta-up`, the palette's success TEXT step — not the
          `good` status fill, which measures 3.18:1 on the light page and fails
          the 4.5:1 a body-size string needs. The arrow and the word "ingresos"
          carry the direction too, so meaning never rests on colour alone.
        */}
        <p className="mt-4 text-lg font-medium text-delta-up">
          <span aria-hidden="true">↑</span> {income}{' '}
          <span className="font-normal text-ink-secondary">
            en ingresos este mes
          </span>
        </p>

        <p className="mt-5 max-w-md text-pretty text-ink-secondary">
          Estas son las categorías en las que más gastas.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.id}>
            <ExpenseCategoryCard
              label={card.label}
              amount={card.amount}
              share={card.share}
              colorVar={card.colorVar}
              icon={<card.Icon className="h-5 w-5" />}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
