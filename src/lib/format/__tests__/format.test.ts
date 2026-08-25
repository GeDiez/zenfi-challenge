import {
  currency,
  currencyCompact,
  monthLabel,
  monthName,
  percent,
  shortDate,
} from '../format'

describe('format', () => {
  describe('currency', () => {
    it('renders pesos without cents', () => {
      expect(currency(1890)).toBe('$1,890')
      expect(currency(48500)).toBe('$48,500')
    })

    it('rounds rather than truncating a fractional amount', () => {
      // The source has amounts like 2340.75; dropping the fraction silently
      // would make a column of rows stop summing to its own total.
      expect(currency(2340.75)).toBe('$2,341')
    })

    it('handles zero', () => {
      expect(currency(0)).toBe('$0')
    })
  })

  describe('currencyCompact', () => {
    it('shortens large amounts for axis ticks and chart labels', () => {
      expect(currencyCompact(48717)).toMatch(/^\$48\.7\s?k$/i)
    })

    it('leaves small amounts readable', () => {
      expect(currencyCompact(156)).toBe('$156')
    })
  })

  describe('percent', () => {
    it('renders an already-normalised share', () => {
      expect(percent(0.61)).toBe('61%')
      expect(percent(0)).toBe('0%')
      expect(percent(1)).toBe('100%')
    })
  })

  describe('shortDate', () => {
    it('keeps the calendar day exactly as written', () => {
      // `new Date('2026-08-01')` is parsed as UTC midnight, so any timezone
      // west of UTC would render this as 31 July. Building from local
      // components is what stops that.
      expect(shortDate('2026-08-01')).toMatch(/^1\s/)
      expect(shortDate('2026-08-31')).toMatch(/^31\s/)
    })

    it('never shifts a day across a month boundary', () => {
      expect(shortDate('2026-01-01')).toMatch(/^1\s/)
      expect(shortDate('2026-12-31')).toMatch(/^31\s/)
    })
  })

  describe('monthLabel and monthName', () => {
    it('reads the month from a YYYY-MM period', () => {
      expect(monthName('2026-08')).toBe('agosto')
      expect(monthLabel('2026-08')).toContain('agosto')
      expect(monthLabel('2026-08')).toContain('2026')
    })

    it('does not slip to the previous month', () => {
      // `new Date('2026-01')` is UTC midnight on 1 January; formatted west of
      // UTC that is December of the year before.
      expect(monthName('2026-01')).toBe('enero')
      expect(monthLabel('2026-01')).toContain('2026')
    })
  })
})
