import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  // The theme is stamped on <html> and persisted, neither of which Testing
  // Library's cleanup touches — without this the suite would depend on the
  // order its own tests happen to run in.
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    window.localStorage.clear()
  })

  it('renders the setup page', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /setup listo/i, level: 1 }),
    ).toBeInTheDocument()
  })

  it('starts on the system theme, leaving no stamp so the OS preference wins', () => {
    render(<App />)

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(
      screen.getByRole('button', { name: /^Tema: Sistema/i }),
    ).toBeInTheDocument()
  })

  it('stamps the chosen theme on the document root, in both directions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /^Tema: Sistema/i }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: /^Tema: Claro/i }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await user.click(screen.getByRole('button', { name: /^Tema: Oscuro/i }))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('persists the theme choice across remounts', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await user.click(screen.getByRole('button', { name: /^Tema: Sistema/i }))
    first.unmount()

    render(<App />)
    expect(
      screen.getByRole('button', { name: /^Tema: Claro/i }),
    ).toBeInTheDocument()
  })
})
