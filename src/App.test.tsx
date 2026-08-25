import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { EXPENSE_CATEGORIES } from './data/expenses'
import { currency, share } from './lib/format'

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

    it('offers the theme control', () => {
      render(<App />)

      expect(
        screen.getByRole('button', { name: /^Tema: Sistema/i }),
      ).toBeInTheDocument()
    })

    it('stamps the chosen theme on the document root, in both directions', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Starts on "system", which leaves no stamp so the OS preference applies.
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)

      await user.click(screen.getByRole('button', { name: /^Tema: Sistema/i }))
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')

      await user.click(screen.getByRole('button', { name: /^Tema: Claro/i }))
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      await user.click(screen.getByRole('button', { name: /^Tema: Oscuro/i }))
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
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

    it('shows a total that actually equals the sum of the categories', () => {
      render(<App />)

      // Summed independently of the module's own derived export, so a broken
      // reduce cannot make this test agree with the bug.
      const expected = EXPENSE_CATEGORIES.reduce(
        (acc, category) => acc + category.amount,
        0,
      )

      expect(screen.getByText(currency(expected))).toBeInTheDocument()
    })

    it('renders one card per category, each naming itself', () => {
      render(<App />)

      for (const category of EXPENSE_CATEGORIES) {
        expect(
          screen.getByRole('heading', { name: category.label, level: 3 }),
        ).toBeInTheDocument()
      }
    })

    it('states each category share against the total, not just its amount', () => {
      render(<App />)

      const total = EXPENSE_CATEGORIES.reduce(
        (acc, category) => acc + category.amount,
        0,
      )
      const food = EXPENSE_CATEGORIES.find((c) => c.id === 'food')
      expect(food).toBeDefined()

      const card = screen
        .getByRole('heading', { name: food!.label, level: 3 })
        .closest('article')
      expect(card).not.toBeNull()

      const scoped = within(card as HTMLElement)
      expect(scoped.getByText(currency(food!.amount))).toBeInTheDocument()
      expect(
        scoped.getByText(new RegExp(share(food!.amount, total))),
      ).toBeInTheDocument()
    })
  })
})
