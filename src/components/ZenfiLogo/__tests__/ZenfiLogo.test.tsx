import { render, screen } from '@testing-library/react'
import { ZenfiLogo } from '../ZenfiLogo'

describe('ZenfiLogo', () => {
  it('names itself for assistive technology', () => {
    render(<ZenfiLogo />)

    expect(screen.getByRole('img', { name: 'Zenfi' })).toBeInTheDocument()
  })

  it('keeps the brand isotype colours exactly as the official asset ships them', () => {
    const { container } = render(<ZenfiLogo />)

    const fills = [...container.querySelectorAll('path')]
      .map((path) => path.getAttribute('fill'))
      .filter((fill): fill is string => fill !== null && fill.startsWith('#'))

    // Only the wordmark was allowed to change. These three are the brand.
    expect(new Set(fills)).toEqual(new Set(['#5B0BE1', '#310F78', '#0096FC']))
  })

  it('lets the wordmark inherit the theme instead of staying white', () => {
    const { container } = render(<ZenfiLogo />)

    const inherited = [...container.querySelectorAll('path')].filter(
      (path) => path.getAttribute('fill') === 'currentColor',
    )

    // The source asset is the `-light` variant: its wordmark ships white and
    // would be invisible on the light surface.
    expect(inherited.length).toBeGreaterThan(0)
    expect(container.querySelector('path[fill="white"]')).toBeNull()
  })
})
