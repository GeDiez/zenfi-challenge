import { useMemo } from 'react'
import {
  buildDailyTotals,
  extremeDay,
  largestChargeOn,
  type Transaction,
} from '../../../data'

/**
 * Where a direct label can sit without being clipped.
 *
 * A label centred over the first or last point runs off the plot — this data's
 * minimum IS the last day, so `position="top"` cropped it. Rather than padding
 * the margin until it happens to fit, the label moves beside the point when the
 * point sits near an edge. (`insideTop*` is not honoured on a ReferenceDot.)
 */
export function labelPosition(
  day: number,
  days: readonly number[],
): 'top' | 'left' | 'right' {
  const first = days[0]
  const last = days[days.length - 1]
  const span = last - first
  if (span === 0) return 'top'

  const t = (day - first) / span
  if (t > 0.85) return 'left'
  if (t < 0.15) return 'right'
  return 'top'
}

export function useController(transactions: Transaction[]) {
  const daily = useMemo(() => buildDailyTotals(transactions), [transactions])
  const peak = useMemo(() => extremeDay(daily, 'max'), [daily])
  const lowest = useMemo(() => extremeDay(daily, 'min'), [daily])
  const driver = useMemo(
    () => (peak === null ? null : largestChargeOn(transactions, peak.date)),
    [transactions, peak],
  )
  const days = useMemo(() => daily.map((entry) => entry.day), [daily])

  const markers = useMemo(
    () =>
      peak === null || lowest === null
        ? []
        : [
            { key: 'max', point: peak, text: 'Máximo' },
            { key: 'min', point: lowest, text: 'Mínimo' },
          ].map((marker) => ({
            ...marker,
            position: labelPosition(marker.point.day, days),
          })),
    [peak, lowest, days],
  )

  return {
    daily,
    peak,
    lowest,
    driver,
    markers,
    hasData: daily.length > 0 && peak !== null && lowest !== null,
  }
}
