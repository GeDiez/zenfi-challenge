import type { FlagId } from '../../data/expenses'
import { FLAG_LABELS } from '../../data/expenses'
import { RecurringIcon, RefundIcon, ReviewIcon } from '../icons'

/**
 * Every flag ships an icon AND its label. Colour never carries the meaning on
 * its own — two of the status steps sit below 3:1 on the light surface by
 * design, and a reader with a colour-vision deficiency gets nothing from hue
 * alone. The pairing is the mitigation, not decoration.
 *
 * Only the flags that actually mean good/bad wear a status colour. `recurring`
 * is a property of the charge, not a verdict on it, so it stays in neutral ink
 * — spending a status colour on it would make the two that matter shout less.
 */
const FLAG_PRESENTATION: Record<
  FlagId,
  {
    Icon: (props: { className?: string }) => React.ReactElement
    colorVar: string | null
  }
> = {
  recurring: { Icon: RecurringIcon, colorVar: null },
  review: { Icon: ReviewIcon, colorVar: '--color-warning' },
  refund: { Icon: RefundIcon, colorVar: '--color-good' },
}

type Props = {
  flag: FlagId
}

export const TransactionFlag = ({ flag }: Props) => {
  const { Icon, colorVar } = FLAG_PRESENTATION[flag]

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-0.5 text-xs whitespace-nowrap text-ink-secondary">
      {/*
        The colour goes on this wrapper, not on the icon: icons draw with
        `currentColor`, so the caller sets the hue through the element around
        them. Passing a `style` to the icon would be dropped — its props are
        className only — and the failure would be silent.
      */}
      <span
        className="flex text-ink-muted"
        style={colorVar === null ? undefined : { color: `var(${colorVar})` }}
      >
        <Icon className="h-3 w-3 shrink-0" />
      </span>
      {FLAG_LABELS[flag]}
    </span>
  )
}
