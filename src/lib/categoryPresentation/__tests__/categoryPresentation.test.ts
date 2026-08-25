import { CATEGORY_TOTALS, UNCATEGORISED_ID } from '../../../data'
import { categoryPresentation, hasOwnHue } from '../categoryPresentation'

describe('categoryPresentation', () => {
  it('gives every real category its own hue', () => {
    const real = CATEGORY_TOTALS.filter((c) => c.id !== UNCATEGORISED_ID)
    for (const category of real) {
      expect(hasOwnHue(category.id)).toBe(true)
    }
  })

  it('assigns a DISTINCT slot to each — no two categories share a colour', () => {
    const real = CATEGORY_TOTALS.filter((c) => c.id !== UNCATEGORISED_ID)
    const slots = real.map((c) => categoryPresentation(c.id).colorVar)
    expect(new Set(slots).size).toBe(slots.length)
  })

  it('leaves the no-category bucket on the neutral', () => {
    // The absence of a category is not a category. Spending a categorical slot
    // on "we don't know" would make it look like a peer of the real ones.
    expect(hasOwnHue(UNCATEGORISED_ID)).toBe(false)
    expect(categoryPresentation(UNCATEGORISED_ID).colorVar).toBe(
      '--color-ink-muted',
    )
  })

  it('falls back to the neutral for a category it has never seen', () => {
    // New data must not crash the page; it renders grey until a slot is
    // assigned on purpose and the palette is re-validated.
    expect(hasOwnHue('categoria-inventada')).toBe(false)
    expect(categoryPresentation('categoria-inventada').colorVar).toBe(
      '--color-ink-muted',
    )
  })

  it('always returns a renderable icon', () => {
    for (const id of [...CATEGORY_TOTALS.map((c) => c.id), 'desconocida']) {
      expect(typeof categoryPresentation(id).Icon).toBe('function')
    }
  })

  it('is stable — the same category always gets the same slot', () => {
    // Colour follows the entity, never its rank: a category that overtakes
    // another must not swap hues with it.
    const first = CATEGORY_TOTALS.map(
      (c) => categoryPresentation(c.id).colorVar,
    )
    const second = CATEGORY_TOTALS.map(
      (c) => categoryPresentation(c.id).colorVar,
    )
    expect(first).toEqual(second)
  })
})
