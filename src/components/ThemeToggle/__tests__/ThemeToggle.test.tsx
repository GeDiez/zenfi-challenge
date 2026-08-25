import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../ThemeToggle'

const toggle = () =>
  screen.getByRole('button', { name: /cambiar a tema (oscuro|claro)/i })

describe('ThemeToggle', () => {
  // The theme is stamped on <html> and persisted; Testing Library's cleanup
  // touches neither, so without this the suite depends on its own order.
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    window.localStorage.clear()
  })

  it('is icon-only but still announces what it does', () => {
    render(<ThemeToggle />)

    // An icon-only control with no accessible name is announced as "button".
    expect(toggle().textContent).toBe('')
    expect(toggle()).toHaveAccessibleName()
  })

  it('leaves the system in charge until the viewer chooses', () => {
    render(<ThemeToggle />)

    // No stamp means the CSS falls back to prefers-color-scheme.
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('stamps a choice and flips it back', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(toggle())
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await user.click(toggle())
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('offers only two states — system is the starting point, not an option', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(toggle())
    await user.click(toggle())
    await user.click(toggle())

    // A third click must land on dark again, never back on "no stamp".
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('survives a storage that throws instead of crashing the page', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked')
      })

    // A private window or blocked site data must not take the app down.
    expect(() => render(<ThemeToggle />)).not.toThrow()
    spy.mockRestore()
  })
})
