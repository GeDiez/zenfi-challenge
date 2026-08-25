import { render, screen } from '@testing-library/react'
import {
  DAILY_TOTALS,
  LOWEST_DAY,
  PEAK_DAY,
  PEAK_DAY_DRIVER,
  TRANSACTIONS,
} from '../../../data'
import { currency } from '../../../lib/format'
import { DailySpendChart } from '../DailySpendChart'

/**
 * Recharts sizes itself from its container and jsdom reports every element as
 * 0x0, so the SVG never renders here. These tests exercise what does not depend
 * on layout: the derived extremes and the textual summary that carries them.
 * The plot itself is verified in a real browser.
 */
describe('DailySpendChart', () => {
  it('names both extremes in text, not only on the plot', () => {
    render(<DailySpendChart transactions={TRANSACTIONS} />)

    expect(PEAK_DAY).not.toBeNull()
    expect(LOWEST_DAY).not.toBeNull()

    // A chart that only works visually excludes anyone using a screen reader.
    const summary = screen.getByText(/gastaste más/)
    expect(summary).toHaveTextContent(currency(PEAK_DAY!.amount))
    expect(summary).toHaveTextContent(currency(LOWEST_DAY!.amount))
  })

  it('derives the extremes from the data rather than assuming them', () => {
    const amounts = DAILY_TOTALS.map((d) => d.amount)
    expect(PEAK_DAY!.amount).toBe(Math.max(...amounts))
    expect(LOWEST_DAY!.amount).toBe(Math.min(...amounts))
  })

  it('covers only the days the export describes, with no invented tail', () => {
    // Drawing the rest of the month as zero would claim nothing was spent when
    // the truth is nothing is known yet.
    const dates = TRANSACTIONS.map((tx) => tx.date).sort()
    expect(DAILY_TOTALS[0].date).toBe(dates[0])
    expect(DAILY_TOTALS[DAILY_TOTALS.length - 1].date).toBe(
      dates[dates.length - 1],
    )
  })

  it('explains the peak with the charge that caused it', () => {
    render(<DailySpendChart transactions={TRANSACTIONS} />)

    expect(PEAK_DAY_DRIVER).not.toBeNull()
    // Without this the spike reads as a data error rather than as rent.
    const note = screen.getByText(/El pico del día/)
    expect(note).toHaveTextContent(PEAK_DAY_DRIVER!.description)
    expect(note).toHaveTextContent(currency(PEAK_DAY_DRIVER!.amount))
  })
})
