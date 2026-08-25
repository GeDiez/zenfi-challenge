import type { ReactNode } from 'react'

type Props = {
  label: string
  amount: string
  share: string
  /** Categorical slot token, e.g. `--color-series-1`. */
  colorVar: string
  icon: ReactNode
}

/**
 * A colourful card that stays readable.
 *
 * The surface is the category hue mixed down into the page surface, and the
 * saturated hue is spent on the small icon chip. A fully saturated card was
 * measured and rejected: across these four hues no single text colour clears
 * 4.5:1 — white fails on three of them, ink fails on two — so a solid block
 * would force unreadable text on some card in some theme.
 *
 * Identity never rests on colour alone either: every card carries its name and
 * a distinct icon, which is what makes the two hues that sit below 3:1 on the
 * light surface legitimate here.
 *
 * The chip's icon is dark ink rather than white for the same measured reason:
 * white drops to 2.17:1 on yellow and 2.69:1 on magenta, under the 3:1 a
 * graphical mark needs. Ink clears it on all four slots in both modes.
 */
export const ExpenseCategoryCard = ({
  label,
  amount,
  share,
  colorVar,
  icon,
}: Props) => (
  <article
    className="flex flex-col gap-4 rounded-2xl border p-5"
    style={{
      backgroundColor: `color-mix(in oklab, var(${colorVar}) 12%, var(--color-surface))`,
      borderColor: `color-mix(in oklab, var(${colorVar}) 28%, transparent)`,
    }}
  >
    <span
      aria-hidden="true"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-on-accent"
      style={{ backgroundColor: `var(${colorVar})` }}
    >
      {icon}
    </span>

    <div>
      <h3 className="text-sm font-medium text-ink-secondary">{label}</h3>
      {/* Proportional figures: tabular-nums makes a standalone number look
          loose at this size, and these do not align in a column. */}
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        {amount}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{share} del total</p>
    </div>
  </article>
)
