import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { FEATURED_CATEGORIES, MONTHLY_TOTAL, TRANSACTIONS } from './data'
import { currency, percent } from './lib/format'

describe('App', () => {
  // The theme is stamped on <html> and persisted, neither of which Testing
  // Library's cleanup touches — without this the suite would depend on the
  // order its own tests happen to run in.
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    window.localStorage.clear()
  })

  describe('header', () => {
    it('links to the GitHub profile without exposing the opener', () => {
      render(<App />)

      const link = screen.getByRole('link', { name: /perfil de github/i })

      expect(link).toHaveAttribute('href', 'https://github.com/GeDiez')
      expect(link).toHaveAttribute('target', '_blank')
      // `noopener` is the security half: without it the opened page can reach
      // back through window.opener.
      expect(link.getAttribute('rel')).toContain('noopener')
    })

    it('is icon-only but still announces what it does', () => {
      render(<App />)

      // An icon-only control without an accessible name is announced as just
      // "button". The label is the whole interface for a screen reader here.
      const toggle = screen.getByRole('button', {
        name: /cambiar a tema (oscuro|claro)/i,
      })
      expect(toggle.textContent).toBe('')
    })

    it('follows the system until the viewer chooses, then the choice wins', async () => {
      const user = userEvent.setup()
      render(<App />)

      // No stamp means the CSS falls back to prefers-color-scheme.
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)

      await user.click(
        screen.getByRole('button', { name: /cambiar a tema oscuro/i }),
      )
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      await user.click(
        screen.getByRole('button', { name: /cambiar a tema claro/i }),
      )
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('persists the choice across remounts', async () => {
      const user = userEvent.setup()
      const first = render(<App />)

      await user.click(
        screen.getByRole('button', { name: /cambiar a tema oscuro/i }),
      )
      first.unmount()

      render(<App />)
      expect(
        screen.getByRole('button', { name: /cambiar a tema claro/i }),
      ).toBeInTheDocument()
    })
  })

  describe('hero', () => {
    it('leads with the monthly total as its heading', () => {
      render(<App />)

      expect(
        screen.getByRole('heading', {
          name: /total de gasto del mes/i,
          level: 1,
        }),
      ).toBeInTheDocument()
    })

    it('shows a total that actually equals the sum of the transactions', () => {
      render(<App />)

      // Summed independently of the module's own derived export, so a broken
      // reduce cannot make this test agree with the bug.
      const expected = TRANSACTIONS.reduce((acc, tx) => acc + tx.amount, 0)
      expect(expected).toBeCloseTo(MONTHLY_TOTAL, 2)
      expect(screen.getByText(currency(expected))).toBeInTheDocument()
    })

    it('features exactly four categories, each naming itself', () => {
      render(<App />)

      expect(FEATURED_CATEGORIES).toHaveLength(4)
      for (const category of FEATURED_CATEGORIES) {
        expect(
          screen.getByRole('heading', { name: category.label, level: 3 }),
        ).toBeInTheDocument()
      }
    })

    it('states each category share against the total, not just its amount', () => {
      render(<App />)

      const biggest = FEATURED_CATEGORIES[0]
      const card = screen
        .getByRole('heading', { name: biggest.label, level: 3 })
        .closest('article')
      expect(card).not.toBeNull()

      const scoped = within(card as HTMLElement)
      expect(scoped.getByText(currency(biggest.amount))).toBeInTheDocument()
      expect(
        scoped.getByText(new RegExp(percent(biggest.share))),
      ).toBeInTheDocument()
    })
  })
})
