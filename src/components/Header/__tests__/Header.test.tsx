import { render, screen } from '@testing-library/react'
import { Header } from '../Header'

describe('Header', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    window.localStorage.clear()
  })

  it('takes the logo home', () => {
    render(<Header />)

    const home = screen.getByRole('link', { name: /zenfi, inicio/i })
    expect(home).toHaveAttribute('href', '/')
  })

  it('links to GitHub without exposing the opener', () => {
    render(<Header />)

    const link = screen.getByRole('link', { name: /perfil de github/i })

    expect(link).toHaveAttribute('href', 'https://github.com/GeDiez')
    expect(link).toHaveAttribute('target', '_blank')
    // `noopener` is the security half: without it the opened page can reach
    // back through window.opener.
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('says the GitHub link opens elsewhere', () => {
    render(<Header />)

    // A target="_blank" that does not warn is a small trap for anyone who
    // relies on the back button.
    expect(
      screen.getByRole('link', { name: /abre en una pestaña nueva/i }),
    ).toBeInTheDocument()
  })

  it('offers the theme control', () => {
    render(<Header />)

    expect(
      screen.getByRole('button', { name: /cambiar a tema/i }),
    ).toBeInTheDocument()
  })
})
