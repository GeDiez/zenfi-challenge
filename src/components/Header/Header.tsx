import { GithubIcon } from '../icons'
import { ThemeToggle } from '../ThemeToggle'
import { ZenfiLogo } from '../ZenfiLogo'

const GITHUB_URL = 'https://github.com/GeDiez'

export const Header = () => (
  <header className="sticky top-0 z-10 border-b border-hairline bg-page/85 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
      <a
        href="/"
        className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-series-1"
        aria-label="Zenfi, inicio"
      >
        {/* The wordmark inherits this colour; the isotype keeps its brand hues. */}
        <ZenfiLogo className="h-7 w-auto text-ink" />
      </a>

      <nav className="flex items-center gap-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          // `noopener` is the security half and is not optional on a
          // target="_blank" link: without it the opened page can reach back
          // through `window.opener`.
          rel="noopener noreferrer"
          aria-label="Perfil de GitHub (abre en una pestaña nueva)"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-wash hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-series-1"
        >
          <GithubIcon className="h-5 w-5" />
        </a>

        <ThemeToggle />
      </nav>
    </div>
  </header>
)
