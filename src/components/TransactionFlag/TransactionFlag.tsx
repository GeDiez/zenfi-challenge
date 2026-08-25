import type { TransactionFlagId } from '../../lib/transactionFlags'
import { ReviewIcon } from '../icons'

type Props = {
  flag: TransactionFlagId
}

/**
 * The icon ships with its label. Colour never carries the meaning alone — the
 * warning step sits below 3:1 on the light surface by design, and a reader with
 * a colour-vision deficiency gets nothing from hue on its own.
 */
export const TransactionFlag = ({ flag }: Props) => {
  if (flag !== 'uncategorised') return null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-0.5 text-xs whitespace-nowrap text-ink-secondary">
      {/* Icons draw with `currentColor`, so the hue goes on the wrapper. A
          `style` passed to the icon would be dropped — its props are className
          only — and the failure would be silent. */}
      <span className="flex" style={{ color: 'var(--color-warning)' }}>
        <ReviewIcon className="h-3 w-3 shrink-0" />
      </span>
      Sin categoría
    </span>
  )
}
